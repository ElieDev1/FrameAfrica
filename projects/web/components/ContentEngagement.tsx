import { CommentsSection } from '@/components/CommentsSection';
import { EngagementBar } from '@/components/EngagementBar';
import { type EngagementTarget, fetchContentComments, fetchEngagement } from '@/lib/engagement';
import { getLocale } from '@/lib/i18n-server';
import { getSession } from '@/lib/session';

/**
 * Drops the whole reader-engagement surface — like / share / comment count, and
 * the conversation itself — onto any content page. Galleries, podcast episodes,
 * interactives and videos each render one of these with their own target.
 */
export async function ContentEngagement({
  type,
  id,
  path,
}: {
  type: EngagementTarget;
  id: string;
  /** This page's route, revalidated when a comment is posted. */
  path: string;
}) {
  const [counts, comments, user, locale] = await Promise.all([
    fetchEngagement(type, id),
    fetchContentComments(type, id),
    getSession(),
    getLocale(),
  ]);

  return (
    <>
      <div className="mt-6 border-t border-border pt-5">
        <EngagementBar type={type} id={id} initial={counts} signedIn={Boolean(user)} />
      </div>
      <CommentsSection
        targetType={type}
        targetId={id}
        path={path}
        comments={comments}
        signedIn={Boolean(user)}
        locale={locale}
      />
    </>
  );
}
