'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmProvider';
import { useT } from '@/components/LocaleProvider';
import { removeIntegration, setIntegration } from '@/lib/settings-actions';
import type { Integration, IntegrationGroup } from '@/lib/settings-types';
import type { MessageKey } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

/** The order sections appear in — socials first, since they are the most edited. */
const GROUP_ORDER: IntegrationGroup[] = [
  'social',
  'site',
  'email',
  'media',
  'storage',
  'search',
  'payments',
  'ai',
  'analytics',
  'custom',
];

const GROUP_TITLE: Record<IntegrationGroup, MessageKey> = {
  social: 'dset.g.social',
  site: 'dset.g.site',
  email: 'dset.g.email',
  media: 'dset.g.media',
  storage: 'dset.g.storage',
  search: 'dset.g.search',
  payments: 'dset.g.payments',
  ai: 'dset.g.ai',
  analytics: 'dset.g.analytics',
  custom: 'dset.g.custom',
};

const GROUP_DESC: Record<IntegrationGroup, MessageKey> = {
  social: 'dset.g.socialDesc',
  site: 'dset.g.siteDesc',
  email: 'dset.g.emailDesc',
  media: 'dset.g.mediaDesc',
  storage: 'dset.g.storageDesc',
  search: 'dset.g.searchDesc',
  payments: 'dset.g.paymentsDesc',
  ai: 'dset.g.aiDesc',
  analytics: 'dset.g.analyticsDesc',
  custom: 'dset.g.customDesc',
};

function StatusPill({ integration }: { integration: Integration }) {
  const t = useT();
  if (!integration.isSet) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-faint" /> {t('dset.notSet')}
      </span>
    );
  }
  const fromDb = integration.source === 'database';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
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
  const ask = useConfirm();
  const [editing, setEditing] = useState(false);
  // A non-secret value (a social URL, a hostname) comes back in the clear, so
  // the field opens pre-filled and the admin can tweak rather than retype it.
  const [value, setValue] = useState(integration.value ?? '');
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
      if (integration.secret) setValue('');
      setEditing(false);
      router.refresh();
    });
  }

  async function remove() {
    const ok = await ask({
      title: t('dset.remove'),
      message: `${integration.label} — ${integration.key}`,
      confirmLabel: t('dset.remove'),
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await removeIntegration(integration.key);
      setValue('');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40">
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

      {integration.isSet && (
        <p className="mt-3 break-all font-mono text-xs text-text">
          {/* Non-secret values are safe to show in full; secrets get the mask. */}
          {integration.secret ? integration.maskedValue : integration.value}
          {integration.updatedAt && (
            <span className="text-faint">
              {' '}
              · {t('dov.updated')} {formatDate(integration.updatedAt)}
            </span>
          )}
        </p>
      )}

      {editing ? (
        <div className="mt-4 flex flex-col gap-2">
          <input
            type={integration.secret ? 'password' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              integration.placeholder ??
              (integration.secret ? t('dset.pasteKey') : t('dset.enterValue'))
            }
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text outline-none focus:border-primary"
          />
          {integration.secret && (
            <p className="font-mono text-[10px] leading-relaxed text-faint">
              {t('dset.secretHint')}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending || !value.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 font-heading text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
            >
              {pending ? t('d.common.saving') : t('d.common.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setValue(integration.value ?? '');
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
            >
              {t('d.common.cancel')}
            </button>
          </div>
          {error && <span className="font-mono text-[11px] text-accent-red">{error}</span>}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            {integration.source === 'database'
              ? t('dset.update')
              : integration.secret
                ? t('dset.setKey')
                : t('dset.setValue')}
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
      )}
    </div>
  );
}

function GroupSection({ group, items }: { group: IntegrationGroup; items: Integration[] }) {
  const t = useT();
  const configured = items.filter((i) => i.isSet).length;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-text">{t(GROUP_TITLE[group])}</h2>
          <p className="mt-0.5 font-body text-sm text-muted">{t(GROUP_DESC[group])}</p>
        </div>
        <span className="font-mono text-[11px] text-faint">
          {configured}/{items.length}
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <IntegrationCard key={i.key} integration={i} />
        ))}
      </div>
    </section>
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
    <section className="rounded-xl border border-dashed border-border bg-surface p-5">
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

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: integrations.filter((i) => i.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-10">
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

      {groups.map(({ group, items }) => (
        <GroupSection key={group} group={group} items={items} />
      ))}

      <AddCustom />
    </div>
  );
}
