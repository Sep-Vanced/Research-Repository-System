'use server';

import { createServiceClient } from '@/lib/supabase/index';
import { requireResearcher, requireAdmin, getUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ResearchStatus } from '@/types/research';
import { createNotification, notifyAllAdmins } from '@/lib/notifications';
import { createCoauthorInvites } from '@/actions/coauthors';
import { logAuditEvent } from '@/lib/audit';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const MAX_RESEARCH_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_RESEARCH_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function extractStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const pathWithQuery = url.slice(idx + marker.length);
  return pathWithQuery.split('?')[0] || null;
}

export async function submitResearch(formData: FormData) {
  const user = await requireResearcher();
  enforceRateLimit({
    namespace: 'action-research-submit',
    key: user.id,
    max: 10,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  const title = formData.get('title') as string;
  const abstract = formData.get('abstract') as string;
  const categoryId = formData.get('category_id') as string;
  const publicationYear = parseInt(formData.get('publication_year') as string);
  const authors = formData.getAll('authors') as string[];
  const keywords = formData.getAll('keywords') as string[];
  const coauthorEmails = formData.getAll('coauthor_emails') as string[];

  // Validate required fields
  if (!title || !categoryId || !publicationYear) {
    throw new Error('Missing required fields');
  }

  // Create research project
  const { data: project, error: projectError } = await supabase
    .from('research_projects')
    .insert({
      title,
      abstract,
      category_id: categoryId,
      publication_year: publicationYear,
      status: 'pending',
      created_by: user.id,
    })
    .select()
    .single();

  if (projectError) {
    console.error('Project error:', projectError);
    throw new Error('Failed to create research project');
  }

  // Add authors
  if (authors.length > 0) {
    const authorData = authors
      .filter((a) => a.trim())
      .map((author, index) => ({
        research_id: project.id,
        author_name: author,
        author_order: index + 1,
      }));

    if (authorData.length > 0) {
      const { error: authorError } = await supabase
        .from('research_authors')
        .insert(authorData);

      if (authorError) {
        console.error('Author error:', authorError);
      }
    }
  }

  // Add keywords
  if (keywords.length > 0) {
    const keywordData = keywords
      .filter((k) => k.trim())
      .map((keyword) => ({
        research_id: project.id,
        keyword: keyword.trim(),
      }));

    if (keywordData.length > 0) {
      const { error: keywordError } = await supabase
        .from('research_keywords')
        .insert(keywordData);

      if (keywordError) {
        console.error('Keyword error:', keywordError);
      }
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/research');

  await notifyAllAdmins({
    title: 'New Research Submission',
    message: `${title} was submitted and is pending review.`,
    relatedResearchId: project.id,
  });

  await createCoauthorInvites(project.id, coauthorEmails);
  await logAuditEvent({
    actorUserId: user.id,
    action: 'research_submitted',
    entityType: 'research',
    entityId: project.id,
    severity: 'info',
    metadata: { title },
  });
  
  return { success: true, projectId: project.id };
}

export async function uploadResearchFile(
  researchId: string,
  file: File
) {
  const user = await requireResearcher();
  enforceRateLimit({
    namespace: 'action-research-upload',
    key: user.id,
    max: 25,
    windowMs: 10 * 60_000,
  });

  const supabase = createServiceClient();

  const { data: research, error: researchError } = await supabase
    .from('research_projects')
    .select('created_by')
    .eq('id', researchId)
    .single();

  if (researchError || !research) {
    throw new Error('Research not found');
  }

  if (research.created_by !== user.id && user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (!file || !file.name) {
    throw new Error('File is required');
  }

  if (!ALLOWED_RESEARCH_FILE_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Allowed: PDF, DOC, DOCX, TXT.');
  }

  if (file.size <= 0 || file.size > MAX_RESEARCH_FILE_SIZE) {
    throw new Error('File size must be between 1 byte and 25 MB.');
  }

  // Upload file to Supabase Storage
  const fileBuffer = await file.arrayBuffer();
  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${researchId}/${Date.now()}_${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('research-files')
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('Failed to upload file');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('research-files')
    .getPublicUrl(filePath);

  // Save file metadata to database
  const { error: fileError } = await supabase
    .from('research_files')
    .insert({
      research_id: researchId,
      file_name: safeFileName,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
    });

  if (fileError) {
    console.error('File metadata error:', fileError);
    throw new Error('Failed to save file metadata');
  }

  revalidatePath(`/research/${researchId}`);
  await logAuditEvent({
    actorUserId: user.id,
    action: 'research_file_uploaded',
    entityType: 'research',
    entityId: researchId,
    severity: 'info',
    metadata: { fileName: file.name },
  });
  
  return { success: true };
}

export async function approveResearch(
  researchId: string,
  comment?: string
) {
  const user = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-research-approve',
    key: user.id,
    max: 60,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  // Update research status
  const { error: updateError } = await supabase
    .from('research_projects')
    .update({ 
      status: 'approved' as ResearchStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', researchId);

  if (updateError) {
    console.error('Update error:', updateError);
    throw new Error('Failed to approve research');
  }

  // Add review record
  if (comment) {
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        research_id: researchId,
        admin_id: user.id,
        comment,
        decision: 'approved',
      });

    if (reviewError) {
      console.error('Review error:', reviewError);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/research');
  revalidatePath(`/research/${researchId}`);

  const { data: research } = await supabase
    .from('research_projects')
    .select('title, created_by')
    .eq('id', researchId)
    .maybeSingle();

  if (research?.created_by) {
    await createNotification({
      userId: research.created_by,
      title: 'Research Approved',
      message: `${research.title} has been approved.`,
      relatedResearchId: researchId,
    });
  }
  await logAuditEvent({
    actorUserId: user.id,
    action: 'research_approved',
    entityType: 'research',
    entityId: researchId,
    severity: 'info',
  });
  
  return { success: true };
}

export async function rejectResearch(
  researchId: string,
  comment: string
) {
  const user = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-research-reject',
    key: user.id,
    max: 60,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  if (!comment) {
    throw new Error('Rejection comment is required');
  }

  // Update research status
  const { error: updateError } = await supabase
    .from('research_projects')
    .update({ 
      status: 'rejected' as ResearchStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', researchId);

  if (updateError) {
    console.error('Update error:', updateError);
    throw new Error('Failed to reject research');
  }

  // Add review record
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert({
      research_id: researchId,
      admin_id: user.id,
      comment,
      decision: 'rejected',
    });

  if (reviewError) {
    console.error('Review error:', reviewError);
  }

  revalidatePath('/admin');
  revalidatePath('/research');
  revalidatePath(`/research/${researchId}`);

  const { data: research } = await supabase
    .from('research_projects')
    .select('title, created_by')
    .eq('id', researchId)
    .maybeSingle();

  if (research?.created_by) {
    await createNotification({
      userId: research.created_by,
      title: 'Research Rejected',
      message: `${research.title} was rejected. Please review admin comments.`,
      relatedResearchId: researchId,
    });
  }
  await logAuditEvent({
    actorUserId: user.id,
    action: 'research_rejected',
    entityType: 'research',
    entityId: researchId,
    severity: 'warning',
  });
  
  return { success: true };
}

export async function publishResearch(researchId: string) {
  const admin = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-research-publish',
    key: admin.id,
    max: 60,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  // Update research status
  const { error: updateError } = await supabase
    .from('research_projects')
    .update({ 
      status: 'published' as ResearchStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', researchId);

  if (updateError) {
    console.error('Update error:', updateError);
    throw new Error('Failed to publish research');
  }

  revalidatePath('/admin');
  revalidatePath('/research');
  revalidatePath(`/research/${researchId}`);

  const { data: research } = await supabase
    .from('research_projects')
    .select('title, created_by')
    .eq('id', researchId)
    .maybeSingle();

  if (research?.created_by) {
    await createNotification({
      userId: research.created_by,
      title: 'Research Published',
      message: `${research.title} is now published.`,
      relatedResearchId: researchId,
    });
  }
  const { data: subscriptions } = await supabase
    .from('alert_subscriptions')
    .select('user_id, scope, value, channel')
    .eq('enabled', true);

  if (research && subscriptions?.length) {
    const { data: project } = await supabase
      .from('research_projects')
      .select(`
        id,
        title,
        category:research_categories(name),
        keywords:research_keywords(keyword)
      `)
      .eq('id', researchId)
      .maybeSingle();

    const categoryName = (project as { category?: { name?: string } | null } | null)?.category?.name?.toLowerCase() || '';
    const keywordList = ((project as { keywords?: { keyword: string }[] } | null)?.keywords || []).map((k) => k.keyword.toLowerCase());

    for (const sub of subscriptions as { user_id: string; scope: 'category' | 'keyword'; value: string; channel: 'in_app' | 'email' }[]) {
      const value = sub.value.toLowerCase();
      const matched = sub.scope === 'category' ? categoryName === value : keywordList.includes(value);
      if (!matched) continue;

      await createNotification({
        userId: sub.user_id,
        title: sub.channel === 'email' ? 'Email Alert Queued' : 'New Published Research',
        message:
          sub.channel === 'email'
            ? `Email alert queued: ${research.title} was published.`
            : `${research.title} was published and matches your alert subscription.`,
        relatedResearchId: researchId,
      });
    }
  }
  await logAuditEvent({
    actorUserId: admin.id,
    action: 'research_published',
    entityType: 'research',
    entityId: researchId,
    severity: 'info',
  });
  
  return { success: true };
}

export async function trackDownload(researchId: string) {
  const user = await getUser();
  enforceRateLimit({
    namespace: 'action-research-download',
    key: user?.id || `anon:${researchId}`,
    max: 120,
    windowMs: 60_000,
  });
  const supabase = createServiceClient();

  const { data: research } = await supabase
    .from('research_projects')
    .select('id, status, created_by')
    .eq('id', researchId)
    .maybeSingle();

  if (!research) {
    throw new Error('Research not found');
  }

  const canDownload =
    research.status === 'approved' ||
    research.status === 'published' ||
    (user && (user.role === 'admin' || user.id === research.created_by));

  if (!canDownload) {
    throw new Error('Unauthorized');
  }

  // Record download
  const { error: downloadError } = await supabase
    .from('downloads')
    .insert({
      research_id: researchId,
      user_id: user?.id || null,
    });

  if (downloadError) {
    console.error('Download tracking error:', downloadError);
    // Don't throw - download should still work
  }

  revalidatePath(`/research/${researchId}`);
  await logAuditEvent({
    actorUserId: user?.id || null,
    action: 'research_downloaded',
    entityType: 'research',
    entityId: researchId,
    severity: 'info',
  });
  
  return { success: true };
}

export async function deleteResearch(researchId: string) {
  const user = await requireResearcher();
  enforceRateLimit({
    namespace: 'action-research-delete',
    key: user.id,
    max: 15,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  // Check ownership or admin
  const { data: research } = await supabase
    .from('research_projects')
    .select('created_by')
    .eq('id', researchId)
    .single();

  if (!research) {
    throw new Error('Research not found');
  }

  if (research.created_by !== user.id && user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Delete files from storage
  const { data: files } = await supabase
    .from('research_files')
    .select('file_url')
    .eq('research_id', researchId);

  if (files) {
    for (const file of files) {
      const filePath = extractStoragePathFromPublicUrl(file.file_url, 'research-files');
      if (filePath) {
        await supabase.storage
          .from('research-files')
          .remove([filePath]);
      }
    }
  }

  // Delete related records
  await supabase.from('downloads').delete().eq('research_id', researchId);
  await supabase.from('reviews').delete().eq('research_id', researchId);
  await supabase.from('research_files').delete().eq('research_id', researchId);
  await supabase.from('research_keywords').delete().eq('research_id', researchId);
  await supabase.from('research_authors').delete().eq('research_id', researchId);
  
  // Delete project
  const { error: deleteError } = await supabase
    .from('research_projects')
    .delete()
    .eq('id', researchId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    throw new Error('Failed to delete research');
  }

  revalidatePath('/dashboard');
  revalidatePath('/research');
  await logAuditEvent({
    actorUserId: user.id,
    action: 'research_deleted',
    entityType: 'research',
    entityId: researchId,
    severity: 'critical',
  });
  
  return { success: true };
}

export async function updateUserRole(userId: string, role: 'admin' | 'researcher' | 'viewer') {
  const admin = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-user-role-update',
    key: admin.id,
    max: 30,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Role update error:', error);
    throw new Error('Failed to update user role');
  }

  revalidatePath('/admin');
  revalidatePath('/admin/users');

  await createNotification({
    userId,
    title: 'Role Updated',
    message: `Your account role was changed to ${role}.`,
  });
  await logAuditEvent({
    actorUserId: admin.id,
    action: 'user_role_updated',
    entityType: 'user',
    entityId: userId,
    severity: 'warning',
    metadata: { role },
  });
  
  return { success: true };
}

