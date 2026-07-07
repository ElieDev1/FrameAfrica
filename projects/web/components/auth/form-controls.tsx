'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

export function AuthField({ label, name, ...rest }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        name={name}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-text outline-none focus:border-primary"
        {...rest}
      />
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 font-heading font-bold text-black transition disabled:opacity-60"
    >
      {pending ? 'Please wait…' : children}
    </button>
  );
}
