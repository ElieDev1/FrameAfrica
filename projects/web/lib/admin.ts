import { redirect } from 'next/navigation';
import { getAccessToken } from './session';
import {
  ROLE_NAMES,
  type RoleName,
  USER_STATUSES,
  type UserStatus,
  type AdminUser,
  type UserFilters,
} from './admin-types';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export { ROLE_NAMES, USER_STATUSES };
export type { RoleName, UserStatus, AdminUser, UserFilters };

/** Admin: list users (server component read). Empty on any error / no access. */
export async function fetchUsers(filters: UserFilters = {}): Promise<AdminUser[]> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const search = new URLSearchParams();
  if (filters.q) search.set('q', filters.q);
  if (filters.role) search.set('role', filters.role);
  if (filters.status) search.set('status', filters.status);
  const query = search.toString();

  const res = await fetch(`${API_URL}/admin/users${query ? `?${query}` : ''}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return [];
  const json = (await res.json()) as { data: AdminUser[] };
  return json.data;
}
