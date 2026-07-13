import { ServiceUnavailableException } from '@nestjs/common';
import type { AdminSettingsService } from '../admin/admin-settings.service';
import type { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

/** The bits of a web-push call the tests assert on. */
interface PushTarget {
  endpoint: string;
}

const sendNotification = jest.fn<Promise<unknown>, [PushTarget, string]>();
const generateVAPIDKeys = jest.fn(() => ({ publicKey: 'new-pub', privateKey: 'new-priv' }));

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    sendNotification: (target: PushTarget, payload: string) => sendNotification(target, payload),
    generateVAPIDKeys: () => generateVAPIDKeys(),
  },
}));

/** What the service upserts for one browser. */
interface UpsertArg {
  where: { endpoint: string };
  create: { userId: string | null };
}

const CONFIGURED = {
  VAPID_PUBLIC_KEY: 'pub',
  VAPID_PRIVATE_KEY: 'priv',
  VAPID_SUBJECT: 'mailto:newsroom@frameafrica.rw',
};

function build(settings: Record<string, string> = CONFIGURED) {
  const store = { ...settings };
  const admin = {
    getValue: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
    setIntegration: jest.fn((k: string, v: string) => {
      store[k] = v;
      return Promise.resolve({});
    }),
  };
  const prisma = {
    pushSubscription: {
      upsert: jest.fn<Promise<unknown>, [UpsertArg]>().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
  };
  const service = new PushService(
    prisma as unknown as PrismaService,
    admin as unknown as AdminSettingsService,
  );
  return { service, prisma, admin, store };
}

function sub(endpoint: string) {
  return { endpoint, p256dh: 'p', auth: 'a' };
}

const ALERT = { title: 'Kigali flood warning', url: '/article/flood' };

describe('PushService', () => {
  beforeEach(() => {
    sendNotification.mockReset().mockResolvedValue({});
    generateVAPIDKeys.mockClear();
  });

  it('refuses to store a subscription it could never send to', async () => {
    const { service, prisma } = build({}); // no keys yet

    await expect(service.subscribe(subscription(), null)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled();
  });

  it('keys the subscription on the endpoint, so re-subscribing is not a duplicate', async () => {
    const { service, prisma } = build();

    await service.subscribe(subscription(), 'u1', 'Firefox');

    const arg = prisma.pushSubscription.upsert.mock.calls[0][0];
    expect(arg.where.endpoint).toBe('https://push.example/abc');
    expect(arg.create.userId).toBe('u1');
  });

  it('lets an anonymous reader take an alert — no account required', async () => {
    const { service, prisma } = build();

    await service.subscribe(subscription(), null);

    const arg = prisma.pushSubscription.upsert.mock.calls[0][0];
    expect(arg.create.userId).toBeNull();
  });

  it('turns alerts off even when push has since been switched off', async () => {
    const { service, prisma } = build({}); // unconfigured
    prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.unsubscribe('https://push.example/abc')).resolves.toEqual({
      removed: true,
    });
  });

  it('sends the alert to every subscribed browser', async () => {
    const { service, prisma } = build();
    prisma.pushSubscription.findMany.mockResolvedValue([sub('https://a'), sub('https://b')]);

    const res = await service.broadcast(ALERT);

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ sent: 2, failed: 0, pruned: 0 });
    const payload = sendNotification.mock.calls[0][1];
    expect(JSON.parse(payload)).toMatchObject({ title: 'Kigali flood warning' });
  });

  it('forgets a browser that says it is gone, rather than retrying it forever', async () => {
    const { service, prisma } = build();
    prisma.pushSubscription.findMany.mockResolvedValue([sub('https://gone'), sub('https://live')]);
    sendNotification.mockImplementation((target) => {
      if (target.endpoint === 'https://gone') {
        return Promise.reject(Object.assign(new Error('Gone'), { statusCode: 410 }));
      }
      return Promise.resolve({});
    });

    const res = await service.broadcast(ALERT);

    expect(res).toEqual({ sent: 1, failed: 0, pruned: 1 });
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: { in: ['https://gone'] } },
    });
  });

  it('keeps a browser that failed for a transient reason', async () => {
    const { service, prisma } = build();
    prisma.pushSubscription.findMany.mockResolvedValue([sub('https://a')]);
    sendNotification.mockRejectedValue(Object.assign(new Error('boom'), { statusCode: 500 }));

    const res = await service.broadcast(ALERT);

    expect(res).toEqual({ sent: 0, failed: 1, pruned: 0 });
    expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
  });

  it('says nothing at all when push is not configured', async () => {
    const { service } = build({});

    await expect(service.broadcast(ALERT)).resolves.toEqual({ sent: 0, failed: 0, pruned: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('generates a key pair and keeps the existing one unless forced', async () => {
    const { service, admin, store } = build({});

    const first = await service.generateKeys();
    expect(first).toEqual({ publicKey: 'new-pub', rotated: false });
    expect(store.VAPID_PRIVATE_KEY).toBe('new-priv');

    admin.setIntegration.mockClear();
    const again = await service.generateKeys(); // already set: do not silently rotate
    expect(again.rotated).toBe(false);
    expect(admin.setIntegration).not.toHaveBeenCalled();
  });

  it('drops every subscription when the keys are deliberately rotated', async () => {
    const { service, prisma } = build();
    prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 4 });

    const res = await service.generateKeys(true);

    expect(res.rotated).toBe(true);
    // They were subscribed under an identity we no longer push with.
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({});
  });
});

function subscription() {
  return { endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } };
}
