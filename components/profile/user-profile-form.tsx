'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { updateMyAvatar, updateMyProfile } from '@/actions/profile';
import { User } from '@/types/research';

type UserProfileFormProps = {
  user: User;
};

const MAX_AVATAR_SIZE = 1024 * 1024;
const CROPPED_OUTPUT_SIZE = 512;
const CROP_VIEW_SIZE = 320;

export default function UserProfileForm({ user }: UserProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('avatar.jpg');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropNaturalWidth, setCropNaturalWidth] = useState(0);
  const [cropNaturalHeight, setCropNaturalHeight] = useState(0);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number; imageX: number; imageY: number } | null>(null);
  const initials = (fullName || user.email).slice(0, 2).toUpperCase();

  const baseScale =
    cropNaturalWidth && cropNaturalHeight
      ? Math.max(CROP_VIEW_SIZE / cropNaturalWidth, CROP_VIEW_SIZE / cropNaturalHeight)
      : 1;
  const displayScale = baseScale * cropZoom;
  const renderedWidth = cropNaturalWidth * displayScale;
  const renderedHeight = cropNaturalHeight * displayScale;

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource);
      if (avatarPreview && avatarPreview !== user.avatar_url && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, cropSource, user.avatar_url]);

  useEffect(() => {
    if (!cropSource) return;

    const probe = new window.Image();
    probe.onload = () => {
      setCropNaturalWidth(probe.naturalWidth);
      setCropNaturalHeight(probe.naturalHeight);
      const nextBaseScale = Math.max(CROP_VIEW_SIZE / probe.naturalWidth, CROP_VIEW_SIZE / probe.naturalHeight);
      const nextWidth = probe.naturalWidth * nextBaseScale;
      const nextHeight = probe.naturalHeight * nextBaseScale;
      setCropPosition({
        x: (CROP_VIEW_SIZE - nextWidth) / 2,
        y: (CROP_VIEW_SIZE - nextHeight) / 2,
      });
    };
    probe.src = cropSource;
  }, [cropSource]);

  useEffect(() => {
    if (!dragStart) return;

    const handlePointerMove = (event: PointerEvent) => {
      const nextX = dragStart.imageX + (event.clientX - dragStart.x);
      const nextY = dragStart.imageY + (event.clientY - dragStart.y);
      setCropPosition({
        x: nextX,
        y: nextY,
      });
    };

    const handlePointerUp = () => {
      setDragStart(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragStart, renderedHeight, renderedWidth]);

  const updateCropZoom = (nextZoom: number) => {
    setCropZoom(nextZoom);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('institution', institution);

    startTransition(async () => {
      try {
        await updateMyProfile(formData);
        setMessage('Profile updated successfully.');
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile';
        setError(msg);
      }
    });
  };

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size >= MAX_AVATAR_SIZE) {
      setAvatarFile(null);
      setAvatarPreview(user.avatar_url || null);
      setMessage(null);
      setError('Image must be smaller than 1 MB. Files 1 MB and above are not allowed.');
      e.target.value = '';
      return;
    }

    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }

    setCropSource(URL.createObjectURL(file));
    setCropFileName(file.name);
    setCropZoom(1);
    setCropOpen(true);
    setAvatarFile(null);
    setMessage(null);
    setError(null);
  };

  const applyCrop = async () => {
    if (!cropSource || !cropNaturalWidth || !cropNaturalHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = CROPPED_OUTPUT_SIZE;
    canvas.height = CROPPED_OUTPUT_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Failed to prepare cropped image.');
      return;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CROPPED_OUTPUT_SIZE, CROPPED_OUTPUT_SIZE);

    ctx.drawImage(
      await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image for cropping.'));
        img.src = cropSource;
      }),
      (cropPosition.x / CROP_VIEW_SIZE) * CROPPED_OUTPUT_SIZE,
      (cropPosition.y / CROP_VIEW_SIZE) * CROPPED_OUTPUT_SIZE,
      (renderedWidth / CROP_VIEW_SIZE) * CROPPED_OUTPUT_SIZE,
      (renderedHeight / CROP_VIEW_SIZE) * CROPPED_OUTPUT_SIZE
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );

    if (!blob) {
      setError('Failed to create cropped image.');
      return;
    }

    if (blob.size >= MAX_AVATAR_SIZE) {
      setError('Cropped image must be smaller than 1 MB. Reduce the source image size and try again.');
      return;
    }

    const nextFile = new File([blob], cropFileName.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
    });

    if (avatarPreview && avatarPreview !== user.avatar_url && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(nextFile);
    setAvatarPreview(URL.createObjectURL(nextFile));
    setCropOpen(false);
    setMessage('Image cropped. You can now upload your picture.');
    setError(null);
  };

  const cancelCrop = () => {
    if (cropSource) {
      URL.revokeObjectURL(cropSource);
      setCropSource(null);
    }
    setDragStart(null);
    setCropOpen(false);
  };

  const onUploadAvatar = () => {
    if (!avatarFile) return;
    if (avatarFile.size >= MAX_AVATAR_SIZE) {
      setMessage(null);
      setError('Image must be smaller than 1 MB. Files 1 MB and above are not allowed.');
      return;
    }
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    startTransition(async () => {
      try {
        const result = await updateMyAvatar(formData);
        setAvatarFile(null);
        setAvatarPreview(result.avatarUrl || null);
        if (cropSource) {
          URL.revokeObjectURL(cropSource);
          setCropSource(null);
        }
        setMessage('Profile picture updated.');
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update profile picture';
        setError(msg);
      }
    });
  };

  const onRemoveAvatar = () => {
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('remove', 'true');

    startTransition(async () => {
      try {
        await updateMyAvatar(formData);
        setAvatarFile(null);
        setAvatarPreview(null);
        if (cropSource) {
          URL.revokeObjectURL(cropSource);
          setCropSource(null);
        }
        setMessage('Profile picture removed. Initials are shown by default.');
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to remove profile picture';
        setError(msg);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Profile Picture</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile preview"
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-blue-700">{initials}</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onAvatarFileChange}
              suppressHydrationWarning
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-blue-700 hover:file:bg-blue-200"
            />
            <p className="text-xs text-slate-500">Allowed: JPG, PNG, WEBP. Image must be smaller than 1 MB. Crop is available before upload.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onUploadAvatar}
                disabled={!avatarFile || isPending}
                suppressHydrationWarning
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upload Picture
              </button>
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={isPending || !avatarPreview}
                suppressHydrationWarning
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use Initials
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-600">
            Email
          </label>
          <input
            id="email"
            value={user.email}
            disabled
            suppressHydrationWarning
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-slate-500"
          />
        </div>
        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-600">
            Role
          </label>
          <input
            id="role"
            value={user.role}
            disabled
            suppressHydrationWarning
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 uppercase text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            suppressHydrationWarning
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 outline-none focus:border-blue-300"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <label htmlFor="institution" className="mb-2 block text-sm font-medium text-slate-700">
            Institution
          </label>
          <input
            id="institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            suppressHydrationWarning
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800 outline-none focus:border-blue-300"
            placeholder="Enter your institution"
          />
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          suppressHydrationWarning
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {cropOpen && cropSource ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Crop Profile Picture</h2>
              <p className="mt-1 text-sm text-slate-500">Drag the image to reposition it inside the circle, then zoom if needed.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <div className="rounded-3xl bg-slate-900/95 p-4">
                  <div
                    className="relative mx-auto overflow-hidden rounded-[2rem] bg-slate-950"
                    style={{ width: CROP_VIEW_SIZE, height: CROP_VIEW_SIZE }}
                    onPointerDown={(event) =>
                      setDragStart({
                        x: event.clientX,
                        y: event.clientY,
                        imageX: cropPosition.x,
                        imageY: cropPosition.y,
                      })
                    }
                  >
                    <Image
                      src={cropSource}
                      alt="Crop preview"
                      width={Math.max(renderedWidth, 1)}
                      height={Math.max(renderedHeight, 1)}
                      unoptimized
                      draggable={false}
                      className="pointer-events-none absolute select-none object-cover"
                      style={{
                        left: cropPosition.x,
                        top: cropPosition.y,
                        width: renderedWidth,
                        height: renderedHeight,
                        maxWidth: 'none',
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_40%,rgba(15,23,42,0.45)_41%,rgba(15,23,42,0.82)_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white shadow-[0_0_0_999px_rgba(15,23,42,0.12)]" />
                  </div>
                  <p className="mt-3 text-center text-xs font-medium tracking-wide text-slate-300">
                    Drag to move
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.01"
                    value={cropZoom}
                    onChange={(e) => updateCropZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  GitHub-style behavior: the circular frame shows what will appear as your avatar.
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={applyCrop}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Apply Crop
                  </button>
                  <button
                    type="button"
                    onClick={cancelCrop}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
