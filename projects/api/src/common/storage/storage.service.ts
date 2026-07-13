import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AdminSettingsService } from '../../admin/admin-settings.service';

/** A guess at the content type, so a browser renders the file instead of downloading it. */
const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

/**
 * Binary storage for uploaded media, with two drivers behind one `save()`:
 *
 * - **S3** whenever an admin has set `S3_BUCKET` (plus credentials) in Settings.
 *   Also covers any S3-compatible host — Cloudflare R2, MinIO — via `S3_ENDPOINT`.
 * - **Local disk** otherwise: files go to the web app's `public/uploads` so Next
 *   serves them at `/uploads/<file>`. Fine for development, but the wrong thing
 *   in production — a container restart or a second instance loses every upload,
 *   which is exactly why the S3 driver exists.
 *
 * The driver is chosen per call from live settings, so switching a deployment to
 * S3 is a Settings change, not a redeploy.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /** Directory the local driver writes to. Override with `UPLOAD_DIR`. */
  private readonly dir =
    process.env.UPLOAD_DIR ?? resolve(process.cwd(), '..', 'web', 'public', 'uploads');

  /** The public URL prefix the local driver serves from. */
  private readonly publicPath = process.env.UPLOAD_PUBLIC_PATH ?? '/uploads';

  /** Reused across calls — building an S3 client per upload is wasteful. */
  private s3Client: S3Client | null = null;
  private s3ClientKey = '';

  constructor(private readonly settings: AdminSettingsService) {}

  /** Persist a file and return its public URL + generated filename. */
  async save(buffer: Buffer, ext: string): Promise<{ url: string; filename: string }> {
    const filename = `${randomUUID()}${ext}`;
    const s3 = await this.s3Config();

    if (s3) {
      try {
        return await this.saveToS3(buffer, ext, filename, s3);
      } catch (error) {
        // Losing a reader's upload because a bucket is misconfigured is worse
        // than falling back — but the operator has to know it happened.
        this.logger.error('S3 upload failed; falling back to local disk', error as Error);
      }
    }
    return this.saveLocally(buffer, filename);
  }

  private async saveLocally(
    buffer: Buffer,
    filename: string,
  ): Promise<{ url: string; filename: string }> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, filename), buffer);
    return { url: `${this.publicPath}/${filename}`, filename };
  }

  private async saveToS3(
    buffer: Buffer,
    ext: string,
    filename: string,
    cfg: S3Config,
  ): Promise<{ url: string; filename: string }> {
    const key = `media/${filename}`;
    const client = this.client(cfg);

    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: MIME_BY_EXT[ext.toLowerCase()] ?? 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    // Serve through the CDN when there is one; otherwise straight from the bucket.
    const base =
      cfg.cdnBaseUrl ??
      (cfg.endpoint
        ? `${cfg.endpoint.replace(/\/$/, '')}/${cfg.bucket}`
        : `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`);

    return { url: `${base.replace(/\/$/, '')}/${key}`, filename };
  }

  private client(cfg: S3Config): S3Client {
    const key = `${cfg.bucket}|${cfg.region}|${cfg.endpoint ?? ''}`;
    if (this.s3Client && this.s3ClientKey === key) return this.s3Client;

    this.s3Client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      // R2/MinIO need path-style addressing; AWS is happy with it too.
      forcePathStyle: Boolean(cfg.endpoint),
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
    this.s3ClientKey = key;
    return this.s3Client;
  }

  /** S3 is used only when a bucket *and* credentials are present. */
  private async s3Config(): Promise<S3Config | null> {
    const [bucket, accessKeyId, secretAccessKey, region, endpoint, cdnBaseUrl] = await Promise.all([
      this.settings.getValue('S3_BUCKET'),
      this.settings.getValue('S3_ACCESS_KEY_ID'),
      this.settings.getValue('S3_SECRET_ACCESS_KEY'),
      this.settings.getValue('S3_REGION'),
      this.settings.getValue('S3_ENDPOINT'),
      this.settings.getValue('CDN_BASE_URL'),
    ]);

    if (!bucket || !accessKeyId || !secretAccessKey) return null;
    return {
      bucket,
      accessKeyId,
      secretAccessKey,
      region: region ?? 'auto',
      endpoint: endpoint ?? undefined,
      cdnBaseUrl: cdnBaseUrl ?? undefined,
    };
  }
}

interface S3Config {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string;
  cdnBaseUrl?: string;
}
