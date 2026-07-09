import { Fragment } from 'react';

const HL_START = String.fromCharCode(2);
const HL_STOP = String.fromCharCode(3);

/**
 * Renders a search snippet where the API wrapped matched terms in U+0002/U+0003
 * control chars. We split on those and wrap matches in `<mark>` — no
 * `dangerouslySetInnerHTML`, so highlighting can never inject markup (XSS-safe).
 */
export function HighlightedSnippet({
  snippet,
  className,
}: {
  snippet: string;
  className?: string;
}) {
  // Split into alternating [plain, match, plain, match, …] pieces.
  const parts = snippet.split(new RegExp(`${HL_START}(.*?)${HL_STOP}`, 'g'));
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-primary/25 px-0.5 text-text">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </span>
  );
}
