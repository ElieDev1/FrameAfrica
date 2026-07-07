/** Public shape of a media-library asset returned to staff clients. */
export interface MediaAssetDto {
  id: string;
  url: string;
  alt: string | null;
  credit: string | null;
  licence: string | null;
  mime: string;
  sizeBytes: number;
  originalName: string | null;
  createdAt: string;
}

/**
 * A minimal structural type for an uploaded file (memory storage), so we don't
 * depend on the ambient `Express.Multer.File` type (no `@types/multer`).
 */
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}
