/**
 * Break-glass account recovery — the safety net for a live system.
 *
 * The brute-force lockout is temporary (it lifts itself after a cooldown), but
 * two situations still need a way in that doesn't depend on the web UI:
 *   1. The only admin forgot their password (a cooldown won't help — they never
 *      knew it), and there's no other admin to reset it for them.
 *   2. Ops need to unlock or reset an account immediately, before the cooldown.
 *
 * This script talks straight to the database with the same Argon2id hashing the
 * app uses, so a recovered account is indistinguishable from a normal one. It is
 * meant to be run on the server by someone with shell + DATABASE_URL access —
 * i.e. it assumes you already hold the keys to the box.
 *
 * Usage (from the repo root or projects/api):
 *   pnpm --filter api admin:recover <email>            # unlock + new temp password
 *   pnpm --filter api admin:recover <email> --unlock   # only clear the lock
 *   pnpm --filter api admin:recover --list-admins      # who are the admins?
 *
 * After a password reset the user must change it on first sign-in.
 */
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { generateTemporaryPassword } from '../src/admin/password-generator';

const prisma = new PrismaClient();

// Mirror PasswordService's Argon2id parameters exactly (documents/05 §3.1).
const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

async function listAdmins(): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { deletedAt: null, roles: { some: { role: { name: 'admin' } } } },
    select: { email: true, displayName: true, status: true, lockedAt: true },
    orderBy: { createdAt: 'asc' },
  });
  if (admins.length === 0) {
    console.log('No admin accounts found.');
    return;
  }
  console.log(`Admins (${admins.length}):`);
  for (const a of admins) {
    const state = a.lockedAt ? `LOCKED @ ${a.lockedAt.toISOString()}` : a.status;
    console.log(`  • ${a.email}  —  ${a.displayName}  [${state}]`);
  }
}

async function recover(email: string, unlockOnly: boolean): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, displayName: true, lockedAt: true },
  });
  if (!user) {
    console.error(`No account found for "${email}".`);
    process.exitCode = 1;
    return;
  }

  if (unlockOnly) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lockedAt: null, failedLoginAttempts: 0 },
    });
    console.log(`Unlocked ${user.email}. Their existing password still works.`);
    return;
  }

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await argon2.hash(tempPassword, ARGON_OPTIONS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: true,
      lockedAt: null,
      failedLoginAttempts: 0,
    },
  });

  console.log('');
  console.log(`Recovered ${user.email} (${user.displayName}).`);
  console.log(`  Temporary password:  ${tempPassword}`);
  console.log('  The account is unlocked and must set a new password at next sign-in.');
  console.log('');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--list-admins')) {
    await listAdmins();
    return;
  }

  const email = args.find((a) => !a.startsWith('--'));
  if (!email) {
    console.error('Usage: admin:recover <email> [--unlock] | admin:recover --list-admins');
    process.exitCode = 1;
    return;
  }

  await recover(email, args.includes('--unlock'));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
