'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/index';
import { logAuditEvent } from '@/lib/audit';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function toggleBookmark(researchId: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  enforceRateLimit({
    namespace: 'action-bookmark-toggle',
    key: user.id,
    max: 100,
    windowMs: 60_000,
  });

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('research_id', researchId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    await logAuditEvent({
      actorUserId: user.id,
      action: 'bookmark_removed',
      entityType: 'research',
      entityId: researchId,
      severity: 'info',
    });
  } else {
    await supabase.from('bookmarks').insert({
      user_id: user.id,
      research_id: researchId,
    });
    await logAuditEvent({
      actorUserId: user.id,
      action: 'bookmark_added',
      entityType: 'research',
      entityId: researchId,
      severity: 'info',
    });
  }

  revalidatePath('/research');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function saveSearch(name: string, filters: Record<string, string | number | undefined>) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  enforceRateLimit({
    namespace: 'action-saved-search-create',
    key: user.id,
    max: 30,
    windowMs: 10 * 60_000,
  });
  if (!name.trim()) throw new Error('Search name is required');

  const supabase = createServiceClient();
  const { error } = await supabase.from('saved_searches').insert({
    user_id: user.id,
    name: name.trim(),
    filters,
  });
  if (error) throw new Error('Failed to save search');
  await logAuditEvent({
    actorUserId: user.id,
    action: 'saved_search_created',
    entityType: 'saved_search',
    severity: 'info',
    metadata: { name },
  });

  revalidatePath('/research');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteSavedSearch(id: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  enforceRateLimit({
    namespace: 'action-saved-search-delete',
    key: user.id,
    max: 60,
    windowMs: 10 * 60_000,
  });

  const supabase = createServiceClient();
  await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', user.id);
  await logAuditEvent({
    actorUserId: user.id,
    action: 'saved_search_deleted',
    entityType: 'saved_search',
    entityId: id,
    severity: 'info',
  });
  revalidatePath('/research');
  return { success: true };
}

export async function markNotificationRead(id: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  enforceRateLimit({
    namespace: 'action-notification-mark-read',
    key: user.id,
    max: 180,
    windowMs: 60_000,
  });

  const supabase = createServiceClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id);

  revalidatePath('/dashboard/notifications');
  await logAuditEvent({
    actorUserId: user.id,
    action: 'notification_marked_read',
    entityType: 'notification',
    entityId: id,
    severity: 'info',
  });
  return { success: true };
}

export async function markAllNotificationsRead() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  enforceRateLimit({
    namespace: 'action-notification-mark-all',
    key: user.id,
    max: 20,
    windowMs: 10 * 60_000,
  });

  const supabase = createServiceClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  revalidatePath('/dashboard/notifications');
  await logAuditEvent({
    actorUserId: user.id,
    action: 'notifications_marked_read_all',
    entityType: 'notification',
    severity: 'info',
  });
  return { success: true };
}
