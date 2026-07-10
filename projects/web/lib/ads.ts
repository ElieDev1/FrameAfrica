const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Public API base the browser uses for ad click-through redirects. */
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:4000/v1';

export type AdPlacement = 'leaderboard' | 'billboard' | 'rectangle' | 'halfpage' | 'native';

export interface HouseAd {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  placement: AdPlacement;
}

/** Fetch an active house ad for a placement (null when none / on error). */
export async function fetchHouseAd(placement: AdPlacement): Promise<HouseAd | null> {
  try {
    const res = await fetch(`${API_URL}/ads?placement=${placement}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: HouseAd | null };
    return json.data;
  } catch {
    return null;
  }
}
