import Image from 'next/image';
import type { Block, BlockImage } from '@/lib/api';

/**
 * Renders a structured article document (documents/13 §2) as designed editorial
 * HTML. Each block maps to a purpose-built, brand-styled component. All text is
 * output-encoded by React (no dangerouslySetInnerHTML), so stored content
 * cannot execute.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="article-body flex flex-col">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          className={
            block.lede
              ? 'mt-2 font-body text-[1.35rem] leading-[1.6] text-text/95'
              : 'mt-5 font-body text-lg leading-[1.8] text-text'
          }
        >
          {block.text}
        </p>
      );

    case 'heading': {
      const id = slugId(block.text);
      if (block.level === 3) {
        return (
          <h3
            id={id}
            className="mt-8 scroll-mt-24 font-heading text-xl font-bold tracking-tight text-text"
          >
            {block.text}
          </h3>
        );
      }
      return (
        <h2
          id={id}
          className="mt-10 scroll-mt-24 font-heading text-2xl font-bold tracking-tight text-text md:text-[1.75rem]"
        >
          {block.text}
        </h2>
      );
    }

    case 'image':
      return (
        <FigureImage
          image={block}
          className="mt-8"
          aspect="aspect-[16/9]"
          sizes="(max-width: 768px) 100vw, 680px"
        />
      );

    case 'gallery':
      return (
        <figure className="mt-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {block.images.map((img, i) => (
              <FigureImage
                key={i}
                image={img}
                aspect="aspect-[4/3]"
                sizes="(max-width: 768px) 100vw, 340px"
                captionInside
              />
            ))}
          </div>
          <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            {block.images.length} photos
          </figcaption>
        </figure>
      );

    case 'pullquote':
      return (
        <figure className="my-9 border-l-4 border-primary pl-5">
          <blockquote className="font-heading text-2xl font-semibold leading-snug text-text md:text-3xl">
            “{block.text}”
          </blockquote>
          {block.attribution && (
            <figcaption className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-primary">
              {block.attribution}
            </figcaption>
          )}
        </figure>
      );

    case 'blockquote':
      return (
        <figure className="my-7 rounded-r-lg border-l-2 border-border-2 bg-surface/60 py-2 pl-5 pr-4">
          <blockquote className="font-body text-lg italic leading-relaxed text-muted">
            {block.text}
          </blockquote>
          {block.attribution && (
            <figcaption className="mt-2 font-mono text-xs text-faint">
              — {block.attribution}
            </figcaption>
          )}
        </figure>
      );

    case 'list':
      return block.style === 'number' ? (
        <ol className="mt-5 list-decimal space-y-2 pl-6 font-body text-lg leading-relaxed text-text marker:font-mono marker:text-primary">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="mt-5 list-disc space-y-2 pl-6 font-body text-lg leading-relaxed text-text marker:text-primary">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case 'factbox':
      return (
        <aside className="my-8 rounded-xl border border-border-2 bg-surface p-5 ring-1 ring-primary/10">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            The context
          </p>
          <h4 className="font-heading text-lg font-bold text-text">{block.title}</h4>
          <p className="mt-2 font-body text-base leading-relaxed text-muted">{block.body}</p>
        </aside>
      );

    case 'embed':
      return (
        <figure className="my-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-border">
            <iframe
              src={block.embedUrl}
              title={block.caption ?? 'Embedded video'}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 font-mono text-[11px] text-faint">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'divider':
      return <hr className="mx-auto my-9 w-16 border-0 border-t-2 border-border-2" aria-hidden />;

    default:
      return null;
  }
}

/** A responsive, credited photo with a fixed editorial aspect (matches the hero). */
function FigureImage({
  image,
  aspect,
  sizes,
  className,
  captionInside,
}: {
  image: BlockImage;
  aspect: string;
  sizes: string;
  className?: string;
  captionInside?: boolean;
}) {
  return (
    <figure className={className}>
      <div className={`relative ${aspect} w-full overflow-hidden rounded-2xl ring-1 ring-border`}>
        <Image src={image.url} alt={image.alt} fill sizes={sizes} className="object-cover" />
      </div>
      {(image.caption || image.credit) && (
        <figcaption
          className={`mt-2 font-mono text-[11px] ${captionInside ? 'text-faint' : 'text-faint'}`}
        >
          {image.caption && <span className="text-muted">{image.caption}</span>}
          {image.caption && image.credit && <span aria-hidden> · </span>}
          {image.credit && <span>Photo: {image.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** Deterministic anchor id for a heading, so sections are linkable. */
function slugId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
