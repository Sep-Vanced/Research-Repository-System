'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/index';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_SIZE = 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function extractStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const pathWithQuery = url.slice(idx + marker.length);
  return pathWithQuery.split('?')[0] || null;
}

export async function updateMyProfile(formData: FormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const fullName = String(formData.get('full_name') || '').trim();
  const institution = String(formData.get('institution') || '').trim();

  if (!fullName) {
    throw new Error('Full name is required');
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      institution: institution || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    throw new Error('Failed to update profile');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath('/admin');

  return { success: true };
}

export async function updateMyAvatar(formData: FormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const remove = String(formData.get('remove') || '') === 'true';
  const file = formData.get('avatar') as File | null;
  const supabase = createServiceClient();

  if (!remove && !file) {
    throw new Error('No image selected');
  }

  if (!remove && file) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      throw new Error('Only JPG, PNG, or WEBP images are allowed');
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new Error('Image must be smaller than 1 MB.');
    }
  }

  let nextAvatarUrl: string | null = null;

  if (!remove && file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error('Failed to upload avatar');
    }

    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    nextAvatarUrl = urlData.publicUrl;
  }

  if ((remove || nextAvatarUrl) && user.avatar_url) {
    const oldPath = extractStoragePathFromPublicUrl(user.avatar_url, AVATAR_BUCKET);
    if (oldPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
    }
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      avatar_url: remove ? null : nextAvatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (userUpdateError) {
    throw new Error('Failed to update avatar');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath('/admin');
  revalidatePath('/research');
  revalidatePath('/submit');

  return { success: true, avatarUrl: remove ? null : nextAvatarUrl };
}
