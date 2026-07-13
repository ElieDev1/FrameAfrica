import type { AdminSettingsService } from '../../admin/admin-settings.service';
import { StorageService } from './storage.service';

// Capture what would be sent to S3 without talking to the network.
const sent: { Bucket?: string; Key?: string; ContentType?: string }[] = [];
const send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send })),
  PutObjectCommand: jest.fn().mockImplementation((input: Record<string, unknown>) => {
    sent.push(input);
    return { input };
  }),
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

function build(settings: Record<string, string> = {}) {
  const admin = { getValue: jest.fn((k: string) => Promise.resolve(settings[k] ?? null)) };
  const service = new StorageService(admin as unknown as AdminSettingsService);
  return { service, admin };
}

const S3_SETTINGS = {
  S3_BUCKET: 'frameafrica-media',
  S3_ACCESS_KEY_ID: 'AKIA...',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_REGION: 'eu-west-1',
};

describe('StorageService', () => {
  beforeEach(() => {
    sent.length = 0;
    send.mockReset().mockResolvedValue({});
  });

  it('writes to local disk when no bucket is configured', async () => {
    const { service } = build(); // dev: nothing set
    const res = await service.save(Buffer.from('x'), '.jpg');

    expect(res.url).toMatch(/^\/uploads\/.+\.jpg$/);
    expect(send).not.toHaveBeenCalled();
  });

  it('uploads to S3 once a bucket and credentials are set', async () => {
    const { service } = build(S3_SETTINGS);

    const res = await service.save(Buffer.from('x'), '.png');

    expect(send).toHaveBeenCalledTimes(1);
    expect(sent[0].Bucket).toBe('frameafrica-media');
    expect(sent[0].Key).toMatch(/^media\/.+\.png$/);
    // A browser must render the image, not download it.
    expect(sent[0].ContentType).toBe('image/png');
    expect(res.url).toBe(`https://frameafrica-media.s3.eu-west-1.amazonaws.com/${sent[0].Key}`);
  });

  it('serves through the CDN when one is configured', async () => {
    const { service } = build({ ...S3_SETTINGS, CDN_BASE_URL: 'https://cdn.frameafrica.rw/' });
    const res = await service.save(Buffer.from('x'), '.webp');
    expect(res.url).toBe(`https://cdn.frameafrica.rw/${sent[0].Key}`);
  });

  it('addresses an S3-compatible host (R2/MinIO) by its endpoint', async () => {
    const { service } = build({
      ...S3_SETTINGS,
      S3_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
    });
    const res = await service.save(Buffer.from('x'), '.jpg');
    expect(res.url).toBe(`https://acct.r2.cloudflarestorage.com/frameafrica-media/${sent[0].Key}`);
  });

  it('never loses an upload: falls back to disk if S3 rejects it', async () => {
    const { service } = build(S3_SETTINGS);
    send.mockRejectedValue(new Error('AccessDenied'));

    const res = await service.save(Buffer.from('x'), '.jpg');

    expect(res.url).toMatch(/^\/uploads\//); // saved, not dropped
  });

  it('ignores a half-configured bucket (no credentials) rather than failing every upload', async () => {
    const { service } = build({ S3_BUCKET: 'frameafrica-media' });
    const res = await service.save(Buffer.from('x'), '.jpg');
    expect(send).not.toHaveBeenCalled();
    expect(res.url).toMatch(/^\/uploads\//);
  });
});
