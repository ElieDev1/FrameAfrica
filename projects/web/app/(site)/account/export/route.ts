import { getAccessToken } from '@/lib/session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Streams the signed-in reader's data export as a downloadable JSON file. */
export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const res = await fetch(`${API_URL}/me/export`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    return new Response('Could not generate your export. Please try again.', { status: 502 });
  }

  const envelope = (await res.json()) as { data: unknown };
  const body = JSON.stringify(envelope.data, null, 2);
  return new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="frame-africa-data.json"',
      'cache-control': 'no-store',
    },
  });
}
