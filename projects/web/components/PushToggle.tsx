'use client';

import { useEffect, useState, useTransition } from 'react';
import { BellIcon, CheckIcon } from '@/components/icons';
import { useT } from '@/components/LocaleProvider';
import { subscribeToAlerts, unsubscribeFromAlerts } from '@/lib/push-actions';

/** The push service wants the key as bytes, not the base64url string it ships as. */
function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return buffer;
}

type State = 'checking' | 'off' | 'on' | 'blocked' | 'unsupported';

/**
 * "Alert me when news breaks."
 *
 * The reader stays in charge: nothing is requested until they press the button
 * (a permission prompt on page load is how a site gets permanently blocked), and
 * pressing it again unsubscribes. Rendered only where the server has confirmed a
 * VAPID key exists, so it is never a button that cannot work.
 */
export function PushToggle({ publicKey }: { publicKey: string }) {
  const t = useT();
  const [state, setState] = useState<State>('checking');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    /** What this browser can do, and whether it is already subscribed. */
    async function currentState(): Promise<State> {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
      if (Notification.permission === 'denied') return 'blocked';
      try {
        const registration = await navigator.serviceWorker.ready;
        return (await registration.pushManager.getSubscription()) ? 'on' : 'off';
      } catch {
        return 'off';
      }
    }

    let live = true;
    void currentState().then((next) => {
      if (live) setState(next);
    });
    return () => {
      live = false;
    };
  }, []);

  function toggle() {
    startTransition(async () => {
      // The service worker also powers offline reading; in dev it may not be
      // registered yet, so make sure it is before asking for a subscription.
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        await unsubscribeFromAlerts(existing.endpoint);
        await existing.unsubscribe();
        setState('off');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // we only ever push a headline the reader sees
        applicationServerKey: urlBase64ToBytes(publicKey),
      });

      const json = subscription.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      const ok =
        json.endpoint && json.keys?.p256dh && json.keys.auth
          ? await subscribeToAlerts({
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            })
          : false;

      if (!ok) {
        // Don't leave the browser subscribed to a server that never recorded it.
        await subscription.unsubscribe();
        setState('off');
        return;
      }
      setState('on');
    });
  }

  if (state === 'unsupported') return null;

  if (state === 'blocked') {
    return <p className="font-mono text-[11px] leading-snug text-faint">{t('push.blocked')}</p>;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || state === 'checking'}
      aria-pressed={state === 'on'}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition disabled:opacity-60 ${
        state === 'on'
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted hover:border-primary hover:text-primary'
      }`}
    >
      {state === 'on' ? <CheckIcon size={13} /> : <BellIcon size={13} />}
      {state === 'on' ? t('push.on') : t('push.off')}
    </button>
  );
}
