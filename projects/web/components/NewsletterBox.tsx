/** Newsletter signup teaser. Delivery lands in a later slice, so the form is a
 * visual placeholder for now. */
export function NewsletterBox() {
  return (
    <section className="rounded-xl border border-border bg-surface-2 p-5">
      <h2 className="font-heading text-lg font-bold text-text">The Daily Frame</h2>
      <p className="mt-1 font-body text-sm text-muted">
        Rwanda and Africa&apos;s top stories in your inbox each morning.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          aria-label="Email address"
          className="rounded-lg border border-border bg-bg px-3 py-2 font-body text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          className="rounded-lg bg-primary px-3 py-2 font-heading text-sm font-bold text-black hover:opacity-90"
        >
          Subscribe
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] text-faint">Newsletter delivery is coming soon.</p>
    </section>
  );
}
