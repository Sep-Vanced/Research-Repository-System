'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/index';
import { createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';

export async function createCoauthorInvites(researchId: string, emails: string[]) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const cleaned = Array.from(
    new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes('@'))
    )
  );

  if (!cleaned.length) return { success: true };

  const rows = cleaned.map((email) => ({
    research_id: researchId,
    invited_by: user.id,
    invited_email: email,
  }));

  await supabase.from('coauthor_invites').insert(rows);
  await logAuditEvent({
    actorUserId: user.id,
    action: 'coauthor_invites_created',
    entityType: 'coauthor_invite',
    entityId: researchId,
    severity: 'info',
    metadata: { count: cleaned.length },
  });

  const { data: project } = await supabase
    .from('research_projects')
    .select('title')
    .eq('id', researchId)
    .maybeSingle();

  for (const email of cleaned) {
    const { data: invitedUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (invitedUser?.id) {
      await createNotification({
        userId: invitedUser.id,
        title: 'Co-author Invite',
        message: `You were invited as a co-author for "${project?.title || 'a research project'}".`,
        relatedResearchId: researchId,
      });
    }
  }

  return { success: true };
}

export async function respondToCoauthorInvite(inviteId: string, response: 'accepted' | 'declined') {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const { data: invite } = await supabase
    .from('coauthor_invites')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle();

  if (!invite || invite.invited_email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  await supabase
    .from('coauthor_invites')
    .update({
      status: response,
      responded_at: new Date().toISOString(),
    })
    .eq('id', inviteId);

  if (invite.invited_by) {
    await createNotification({
      userId: invite.invited_by,
      title: 'Co-author Invite Response',
      message: `${user.email} ${response} your co-author invite.`,
      relatedResearchId: invite.research_id,
    });
  }
  await logAuditEvent({
    actorUserId: user.id,
    action: `coauthor_invite_${response}`,
    entityType: 'coauthor_invite',
    entityId: inviteId,
    severity: 'info',
  });

  revalidatePath('/dashboard');
  return { success: true };
}
