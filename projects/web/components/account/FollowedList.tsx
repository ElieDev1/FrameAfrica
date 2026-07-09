'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { type FollowedSubject, type FollowTarget, toggleFollow } from '@/lib/follows-actions';
import { CloseIcon } from '../icons';

interface Props {
  sections: FollowedSubject[];
  topics: FollowedSubject[];
}

/**
 * The account "Following" list: chips for followed sections and topics, each
 * with an inline unfollow. Optimistic — a removed chip disappears immediately.
 */
export function FollowedList({ sections, topics }: Props) {
  const [secs, setSecs] = useState(sections);
  const [tops, setTops] = useState(topics);

  const total = secs.length + tops.length;
  if (total === 0) {
    return (
      <p className="mt-3 font-body text-sm text-muted">
        You don&apos;t follow anything yet. Tap <span className="text-text">Follow</span> on any
        section or topic to see it here and shape your feed.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      {secs.length > 0 && (
        <Group
          heading="Sections"
          base="/section"
          target="section"
          items={secs}
          onRemove={(id) => setSecs((xs) => xs.filter((x) => x.id !== id))}
        />
      )}
      {tops.length > 0 && (
        <Group
          heading="Topics"
          base="/topic"
          target="topic"
          items={tops}
          onRemove={(id) => setTops((xs) => xs.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}

function Group({
  heading,
  base,
  target,
  items,
  onRemove,
}: {
  heading: string;
  base: string;
  target: FollowTarget;
  items: FollowedSubject[];
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{heading}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Chip key={item.id} base={base} target={target} item={item} onRemove={onRemove} />
        ))}
      </ul>
    </div>
  );
}

function Chip({
  base,
  target,
  item,
  onRemove,
}: {
  base: string;
  target: FollowTarget;
  item: FollowedSubject;
  onRemove: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function unfollow() {
    startTransition(async () => {
      try {
        await toggleFollow(target, item.id, false);
        onRemove(item.id);
      } catch {
        // leave the chip in place on failure
      }
    });
  }

  return (
    <li className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 pl-3 pr-1 text-sm">
      <Link
        href={`${base}/${item.slug}`}
        className="py-1.5 font-medium text-text hover:text-primary"
      >
        {item.name}
      </Link>
      <button
        type="button"
        onClick={unfollow}
        disabled={pending}
        aria-label={`Unfollow ${item.name}`}
        className="grid h-6 w-6 place-items-center rounded-full text-faint transition hover:bg-surface hover:text-accent-red disabled:opacity-50"
      >
        <CloseIcon size={13} aria-hidden />
      </button>
    </li>
  );
}
