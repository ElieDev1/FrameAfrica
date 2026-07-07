import { requireAdmin } from '@/lib/cms';

export default async function UsersPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-black tracking-tight text-text">
        Users &amp; roles
      </h1>
      <p className="mt-2 font-body text-muted">
        Manage staff and readers, and assign roles (journalist, editor, moderator, admin).
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-heading text-lg font-bold text-text">Coming next</p>
        <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted">
          The admin users API (list, search, assign/revoke roles) is the next slice. Until then,
          roles are managed via the seed and setup scripts.
        </p>
      </div>
    </div>
  );
}
