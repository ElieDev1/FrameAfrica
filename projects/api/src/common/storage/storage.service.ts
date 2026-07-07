import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

/**
 * Binary storage for uploaded media. This is the **local** driver used in dev:
 * files are written under the web app's `public/uploads` directory so Next
 * serves them at a same-origin `/uploads/<file>` URL (which the block sanitiser
 * already allows). In production this is swapped for an S3/CDN driver behind the
 * same `save()` contract — nothing else changes.
 */
@Injectable()
export class StorageService {
  /** Directory the files are written to. Override with `UPLOAD_DIR`. */
  private readonly dir =
    process.env.UPLOAD_DIR ?? resolve(process.cwd(), '..', 'web', 'public', 'uploads');

  /** The public URL prefix the files are served from. Override with `UPLOAD_PUBLIC_PATH`. */
  private readonly publicPath = process.env.UPLOAD_PUBLIC_PATH ?? '/uploads';

  /** Persist a file and return its public URL + generated filename. */
  async save(buffer: Buffer, ext: string): Promise<{ url: string; filename: string }> {
    await mkdir(this.dir, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(join(this.dir, filename), buffer);
    return { url: `${this.publicPath}/${filename}`, filename };
  }
}
