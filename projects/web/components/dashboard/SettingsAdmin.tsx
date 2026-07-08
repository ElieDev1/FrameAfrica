'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { removeIntegration, setIntegration } from '@/lib/settings-actions';
import type { Integration } from '@/lib/settings-types';

function SourceBadge({ integration }: { integration: Integration }) {
  if (!integration.isSet) {
    return <span className="font-mono text-[11px] text-faint">Not set</span>;
  }
  const label = integration.source === 'database' ? 'Configured' : 'From environment';
  return (
    <span className="font-mono text-[11px] text-primary">
      {integration.maskedValue} <span className="text-muted">· {label}</span>
    </span>
  );
}

function IntegrationRow({ integration }: { integration: Integration }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setIntegration(integration.key, value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setValue('');
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeIntegration(integration.key);
      router.refresh();
    });
  }

  return (
    <div className="border-t border-border px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-body text-sm font-semibold text-text">{integration.label}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {integration.key}
          </div>
          <p className="mt-1 max-w-md font-body text-xs text-muted">{integration.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SourceBadge integration={integration} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="font-mono text-[11px] text-primary hover:underline"
            >
              {integration.source === 'database' ? 'Update' : 'Set key'}
            </button>
            {integration.source === 'database' && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="font-mono text-[11px] text-muted hover:text-accent-red disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Paste ${integration.label} key…`}
            autoComplete="off"
            className="w-72 max-w-full rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
      )}
    </div>
  );
}

function AddCustom() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await setIntegration(key.trim().toUpperCase(), value);
      if (res.error) {
        setError(res.error);
        return;
      }
      setKey('');
      setValue('');
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-heading text-lg font-bold text-text">Add a custom key</h2>
      <p className="mt-1 font-body text-sm text-muted">
        For any integration not listed above. Use UPPER_SNAKE_CASE (e.g. <code>MAPBOX_TOKEN</code>).
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="KEY_NAME"
          className="w-48 rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-sm uppercase text-text outline-none focus:border-primary"
        />
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          autoComplete="off"
          className="w-64 max-w-full rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !key.trim() || !value.trim()}
          className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
        {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
      </div>
    </section>
  );
}

export function SettingsAdmin({ integrations }: { integrations: Integration[] }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-xl border border-border">
        <div className="bg-surface px-4 py-3">
          <h2 className="font-heading text-lg font-bold text-text">Integrations &amp; API keys</h2>
          <p className="mt-1 font-body text-sm text-muted">
            Keys are stored securely and never shown in full again — only a masked hint. A value set
            here overrides the matching environment variable.
          </p>
        </div>
        {integrations.map((i) => (
          <IntegrationRow key={i.key} integration={i} />
        ))}
      </section>
      <AddCustom />
    </div>
  );
}
