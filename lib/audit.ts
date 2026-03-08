import { createServiceClient } from '@/lib/supabase/index';

export async function logAuditEvent(params: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  await supabase.from('audit_events').insert({
    actor_user_id: params.actorUserId || null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    severity: params.severity || 'info',
    metadata: params.metadata || {},
  });
}
