'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/index';
import { logAuditEvent } from '@/lib/audit';

export async function addAlertSubscription(scope: 'category' | 'keyword', value: string, channel: 'in_app' | 'email') {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  if (!value.trim()) throw new Error('Value is required');

  const supabase = createServiceClient();
  const { error } = await supabase.from('alert_subscriptions').upsert({
    user_id: user.id,
    scope,
    value: value.trim(),
    channel,
    enabled: true,
  });
  if (error) throw new Error('Failed to add alert subscription');

  await logAuditEvent({
    actorUserId: user.id,
    action: 'alert_subscription_created',
    entityType: 'alert_subscription',
    severity: 'info',
    metadata: { scope, value, channel },
  });

  revalidatePath('/dashboard/alerts');
  return { success: true };
}

export async function deleteAlertSubscription(id: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  await supabase.from('alert_subscriptions').delete().eq('id', id).eq('user_id', user.id);

  await logAuditEvent({
    actorUserId: user.id,
    action: 'alert_subscription_deleted',
    entityType: 'alert_subscription',
    entityId: id,
    severity: 'info',
  });

  revalidatePath('/dashboard/alerts');
  return { success: true };
}
