'use client';

import { useEffect, useRef } from 'react';
import { recordPageView } from '@/lib/analytics-actions';

/**
 * Fires an anonymous page-view beacon once per mount (all readers). Renders
 * nothing. Sends the path, the article id (when on a story), and the referrer
 * host so editors get real-time performance without any per-user tracking.
 */
export function TrackView({ articleId }: { articleId?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void recordPageView(window.location.pathname, articleId, document.referrer || undefined);
  }, [articleId]);
  return null;
}
