import { UsersAdmin } from '@/components/dashboard/UsersAdmin';
import { fetchUsers } from '@/lib/admin';
import { requireAdmin } from '@/lib/cms';

export default async function UsersPage() {
  await requireAdmin();
  const users = await fetchUsers();

  return (
    <div className="w-full">
      <UsersAdmin initial={users} />
    </div>
  );
}
