/** A trusted provider embed in a sandboxed iframe (data viz / interactive). */
export function EmbedFrame({
  src,
  title,
  aspectRatio = '16/9',
}: {
  src: string;
  title: string;
  aspectRatio?: string;
}) {
  return (
    <div
      style={{ aspectRatio }}
      className="w-full overflow-hidden rounded-xl bg-surface-2 ring-1 ring-border"
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
