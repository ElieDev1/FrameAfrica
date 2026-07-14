'use client';

/**
 * "Download" a receipt via the browser's own print-to-PDF. No PDF library, no
 * server round-trip, no external request — the print dialog's "Save as PDF" is a
 * real, offline download, and the page's print styles make the output a clean
 * document rather than a screenshot of the site.
 */
export function DownloadReceipt({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-black transition hover:opacity-90"
    >
      {label}
    </button>
  );
}
