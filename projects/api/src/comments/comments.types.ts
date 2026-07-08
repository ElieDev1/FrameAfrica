export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

/** A public comment with its (one-level) replies. */
export interface CommentView {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  author: CommentAuthor;
  replies: CommentView[];
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

/** A flagged comment in the moderation queue. */
export interface FlaggedComment {
  id: string;
  body: string;
  status: string;
  reportCount: number;
  createdAt: string;
  author: CommentAuthor;
  article: { slug: string; title: string };
}
