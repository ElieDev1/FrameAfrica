/** Format an ISO timestamp as e.g. "6 Jul 2026"; empty string when null. */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
