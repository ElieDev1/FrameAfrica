'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useT } from '@/components/LocaleProvider';
import { removeIntegration, setIntegration } from '@/lib/settings-actions';
import type { Integration } from '@/lib/settings-types';
import { formatDate } from '@/lib/format';

function StatusPill({ integration }: { integration: Integration }) {
  const t = useT();
  if (!integration.isSet) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-faint" /> {t('dset.notSet')}
      </span>
    );
  }
  const fromDb = integration.source === 'database';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        fromDb ? 'border-accent-green/40 text-accent-green' : 'border-primary/40 text-primary'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${fromDb ? 'bg-accent-green' : 'bg-primary'}`} />
      {fromDb ? t('dset.configured') : t('dset.environment')}
    </span>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const router = useRouter();
  const t = useT();
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
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-text">{integration.label}</h3>
          <code className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {integration.key}
          </code>
        </div>
        <StatusPill integration={integration} />
      </div>

      <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-muted">
        {integration.description}
      </p>

      {integration.isSet && integration.maskedValue && (
        <p className="mt-3 font-mono text-xs text-text">
          {integration.maskedValue}
          {integration.updatedAt && (
            <span className="text-faint">
              {' '}
              · {t('dov.updated')} {formatDate(integration.updatedAt)}
            </span>
          )}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary"
        >
          {integration.source === 'database' ? t('dset.update') : t('dset.setKey')}
        </button>
        {integration.source === 'database' && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent-red hover:text-accent-red disabled:opacity-50"
          >
            {t('dset.remove')}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('dset.pasteKey')}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t('d.common.saving') : t('d.common.save')}
          </button>
          {error && <span className="w-full font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
      )}
    </div>
  );
}

function AddCustom() {
  const router = useRouter();
  const t = useT();
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
      <h2 className="font-heading text-lg font-bold text-text">{t('dset.addCustomKey')}</h2>
      <p className="mt-1 font-body text-sm text-muted">{t('dset.addCustomDesc')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="KEY_NAME"
          className="w-48 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-sm uppercase text-text outline-none focus:border-primary"
        />
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('dset.value')}
          autoComplete="off"
          className="w-64 max-w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !key.trim() || !value.trim()}
          className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          {t('d.common.add')}
        </button>
        {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
      </div>
    </section>
  );
}

export function SettingsAdmin({ integrations }: { integrations: Integration[] }) {
  const t = useT();
  const configured = integrations.filter((i) => i.isSet).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">
          {t('dash.settings')}
        </h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted">{t('dset.subtitle')}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 font-mono text-[11px] text-muted">
          <span className="font-bold text-text">{configured}</span> {t('dset.of')}{' '}
          {integrations.length} {t('dset.integrationsConfigured')}
        </p>
      </div>

      {/* Integration cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((i) => (
          <IntegrationCard key={i.key} integration={i} />
        ))}
      </div>

      <AddCustom />
    </div>
  );
}
