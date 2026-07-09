'use client';

import { useEffect, useRef } from 'react';
import { recordView } from '@/lib/history-actions';

/**
 * Records a reading-history entry for the signed-in reader when an article
 * mounts. Renders nothing; fires once per mount, best-effort (never throws).
 */
export function RecordView({ articleId, signedIn }: { articleId: string; signedIn: boolean }) {
  const recorded = useRef(false);
  useEffect(() => {
    if (!signedIn || recorded.current) return;
    recorded.current = true;
    void recordView(articleId);
  }, [articleId, signedIn]);
  return null;
}
