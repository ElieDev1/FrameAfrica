'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CloseIcon, PenIcon } from '@/components/icons';
import { type ProfileFormState, updateProfile } from '@/lib/profile-actions';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}

/**
 * Edit-profile modal: change display name and avatar with a live preview.
 * Bound to the `updateProfile` server action; the page revalidates on success
 * so the new name/photo appear across the account page and header.
 */
export function EditProfileForm({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState(avatarUrl ?? '');
  const closedOnSuccess = useRef(false);

  const openModal = () => {
    setName(displayName);
    setAvatar(avatarUrl ?? '');
    closedOnSuccess.current = false;
    setOpen(true);
  };

  // Close the modal once, when the save action resolves successfully.
  useEffect(() => {
    if (state.success && open && !closedOnSuccess.current) {
      closedOnSuccess.current = true;
      setOpen(false);
    }
  }, [state.success, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
      >
        <PenIcon size={15} aria-hidden />
        Edit profile
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Edit profile"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-black tracking-tight text-text">
                Edit profile
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form action={action} className="mt-5 space-y-4">
              {/* Live avatar preview */}
              <div className="flex items-center gap-4">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar preview, arbitrary host
                  <img
                    src={avatar}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 font-heading text-2xl font-black text-primary ring-1 ring-primary/20">
                    {initials(name)}
                  </span>
                )}
                <p className="text-xs text-muted">
                  Your photo shows on comments and your account. Paste an image URL, or leave it
                  blank to use your initials.
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  Display name
                </span>
                <input
                  name="displayName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  Avatar URL
                </span>
                <input
                  name="avatarUrl"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://…"
                  maxLength={500}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
                />
              </label>

              {state.error && (
                <p role="alert" className="text-sm text-accent-red">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-text"
                >
                  Cancel
                </button>
                <SaveButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
