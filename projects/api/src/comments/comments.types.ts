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
  author: CommentAuthor;
  replies: CommentView[];
}
