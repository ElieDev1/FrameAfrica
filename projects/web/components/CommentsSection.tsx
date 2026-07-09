import Link from 'next/link';
import type { Comment } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { CommentActions } from './CommentActions';
import { CommentForm } from './CommentForm';
import { CommentIcon } from './icons';

/** First initial of a display name, for the avatar monogram. */
function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function CommentItem({ comment, signedIn }: { comment: Comment; signedIn: boolean }) {
  return (
    <li>
      <article className="flex gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 font-heading text-sm font-bold text-primary ring-1 ring-border"
        >
          {initial(comment.author.displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 font-mono text-[11px] text-muted">
            <span className="font-semibold text-text">{comment.author.displayName}</span>
            <span>· {formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-line font-body text-[0.95rem] leading-relaxed text-text">
            {comment.body}
          </p>
          <CommentActions id={comment.id} initialLikes={comment.likeCount} signedIn={signedIn} />
        </div>
      </article>
      {comment.replies.length > 0 && (
        <ul className="ml-4 mt-4 flex flex-col gap-4 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} signedIn={signedIn} />
          ))}
        </ul>
      )}
    </li>
  );
}

function countComments(comments: Comment[]): number {
  return comments.reduce((n, c) => n + 1 + c.replies.length, 0);
}

export function CommentsSection({
  articleId,
  slug,
  comments,
  signedIn,
}: {
  articleId: string;
  slug: string;
  comments: Comment[];
  signedIn: boolean;
}) {
  const total = countComments(comments);

  return (
    <section
      id="comments"
      aria-labelledby="comments-heading"
      className="mt-12 border-t border-border pt-8"
    >
      <h2
        id="comments-heading"
        className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted"
      >
        <CommentIcon size={14} />
        Comments{total > 0 ? ` (${total})` : ''}
      </h2>

      {signedIn ? (
        <div className="mb-8">
          <CommentForm articleId={articleId} slug={slug} />
        </div>
      ) : (
        <p className="mb-8 font-body text-sm text-muted">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      {comments.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} signedIn={signedIn} />
          ))}
        </ul>
      ) : (
        <p className="font-body text-sm text-muted">No comments yet — be the first to weigh in.</p>
      )}
    </section>
  );
}
