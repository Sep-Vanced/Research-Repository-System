import { createServiceClient } from '@/lib/supabase/index';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  relatedResearchId?: string;
}) {
  const supabase = createServiceClient();
  await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    related_research_id: params.relatedResearchId || null,
  });
}

export async function notifyAllAdmins(params: {
  title: string;
  message: string;
  relatedResearchId?: string;
}) {
  const supabase = createServiceClient();
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (!admins?.length) return;

  await supabase.from('notifications').insert(
    admins.map((admin) => ({
      user_id: admin.id,
      title: params.title,
      message: params.message,
      related_research_id: params.relatedResearchId || null,
    }))
  );
}
