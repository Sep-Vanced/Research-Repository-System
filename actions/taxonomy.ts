'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/index';
import { logAuditEvent } from '@/lib/audit';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function createCategoryAction(name: string, description?: string) {
  const admin = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-taxonomy-create-category',
    key: admin.id,
    max: 30,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();

  if (!name.trim()) throw new Error('Category name is required');

  const { error } = await supabase.from('research_categories').insert({
    name: name.trim(),
    description: description?.trim() || null,
  });
  if (error) throw new Error('Failed to create category');
  await logAuditEvent({
    actorUserId: admin.id,
    action: 'category_created',
    entityType: 'taxonomy_category',
    severity: 'info',
    metadata: { name },
  });

  revalidatePath('/admin');
  revalidatePath('/submit');
  revalidatePath('/research');
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const admin = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-taxonomy-delete-category',
    key: admin.id,
    max: 30,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();
  const { error } = await supabase.from('research_categories').delete().eq('id', id);
  if (error) throw new Error('Failed to delete category');
  await logAuditEvent({
    actorUserId: admin.id,
    action: 'category_deleted',
    entityType: 'taxonomy_category',
    entityId: id,
    severity: 'warning',
  });

  revalidatePath('/admin');
  revalidatePath('/submit');
  revalidatePath('/research');
  return { success: true };
}

export async function addTaxonomyKeywordAction(keyword: string) {
  const admin = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-taxonomy-add-keyword',
    key: admin.id,
    max: 60,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();
  if (!keyword.trim()) throw new Error('Keyword is required');

  const { error } = await supabase.from('taxonomy_keywords').insert({
    keyword: keyword.trim().toLowerCase(),
    created_by: admin.id,
  });
  if (error) throw new Error('Failed to add keyword');
  await logAuditEvent({
    actorUserId: admin.id,
    action: 'taxonomy_keyword_created',
    entityType: 'taxonomy_keyword',
    severity: 'info',
    metadata: { keyword },
  });

  revalidatePath('/admin');
  revalidatePath('/submit');
  return { success: true };
}

export async function deleteTaxonomyKeywordAction(id: string) {
  const admin = await requireAdmin();
  enforceRateLimit({
    namespace: 'action-taxonomy-delete-keyword',
    key: admin.id,
    max: 60,
    windowMs: 10 * 60_000,
  });
  const supabase = createServiceClient();
  const { error } = await supabase.from('taxonomy_keywords').delete().eq('id', id);
  if (error) throw new Error('Failed to delete keyword');
  await logAuditEvent({
    actorUserId: admin.id,
    action: 'taxonomy_keyword_deleted',
    entityType: 'taxonomy_keyword',
    entityId: id,
    severity: 'warning',
  });

  revalidatePath('/admin');
  revalidatePath('/submit');
  return { success: true };
}
