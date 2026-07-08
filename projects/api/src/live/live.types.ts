/** A single live-coverage update as served to readers. */
export interface LiveUpdateDto {
  id: string;
  headline: string | null;
  body: string;
  isKeyEvent: boolean;
  createdAt: string;
  author: string;
}
