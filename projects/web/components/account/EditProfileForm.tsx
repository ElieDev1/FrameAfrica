'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CloseIcon, PenIcon } from '@/components/icons';
import { type ProfileFormState, updateProfile } from '@/lib/profile-actions';
import { useT } from '@/components/LocaleProvider';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function SaveButton() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t('common.saving') : t('common.save')}
    </button>
  );
}

/**
 * Edit-profile modal: change display name and avatar with a live preview.
 * Bound to the `updateProfile` server action; the page revalidates on success
 * so the new name/photo appear across the account page and header.
 */
/** The public-byline part of a staff member's profile. */
export interface Byline {
  bio: string;
  jobTitle: string;
  /** Their /author/<slug> page, once they have published (else null). */
  slug: string | null;
}

export function EditProfileForm({
  displayName,
  avatarUrl,
  byline,
}: {
  displayName: string;
  avatarUrl: string | null;
  /** Present for staff only — a plain reader has no byline. */
  byline?: Byline;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState(avatarUrl ?? '');
  const [bio, setBio] = useState(byline?.bio ?? '');
  const [jobTitle, setJobTitle] = useState(byline?.jobTitle ?? '');
  const closedOnSuccess = useRef(false);
  const t = useT();

  const openModal = () => {
    setName(displayName);
    setAvatar(avatarUrl ?? '');
    setBio(byline?.bio ?? '');
    setJobTitle(byline?.jobTitle ?? '');
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
        {t('account.editProfile')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('account.editProfile')}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-black tracking-tight text-text">
                {t('account.editProfile')}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
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
                <p className="text-xs text-muted">{t('account.avatarDesc')}</p>
              </div>

              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {t('account.displayName')}
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
                  {t('account.avatarUrl')}
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

              {/* Byline — staff only. This is what a reader sees on the author page
                  a story links to, so it is worth filling in. */}
              {byline && (
                <fieldset className="space-y-4 border-t border-border pt-4">
                  <legend className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                    {t('account.byline')}
                  </legend>

                  <label className="block">
                    <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      {t('account.jobTitle')}
                    </span>
                    <input
                      name="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={t('account.jobTitlePlaceholder')}
                      maxLength={120}
                      className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      {t('account.bio')}
                    </span>
                    <textarea
                      name="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={600}
                      placeholder={t('account.bioPlaceholder')}
                      className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text outline-none focus:border-primary"
                    />
                  </label>

                  {byline.slug && (
                    <a
                      href={`/author/${byline.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-mono text-[11px] text-primary hover:underline"
                    >
                      {t('account.viewAuthorPage')} →
                    </a>
                  )}
                </fieldset>
              )}

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
                  {t('common.cancel')}
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
