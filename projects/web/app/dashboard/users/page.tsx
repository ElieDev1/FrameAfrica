import { UsersAdmin } from '@/components/dashboard/UsersAdmin';
import { fetchUsers } from '@/lib/admin';
import { requireAdmin } from '@/lib/cms';

export default async function UsersPage() {
  await requireAdmin();
  const users = await fetchUsers();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">
        Users &amp; roles
      </h1>
      <p className="mt-2 font-body text-muted">
        Create staff and reader accounts, assign roles, suspend access, and reset passwords. New
        accounts get a generated password and must set their own at first sign-in.
      </p>
      <div className="mt-8">
        <UsersAdmin initial={users} />
      </div>
    </div>
  );
}
