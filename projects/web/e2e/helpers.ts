import type { Page } from '@playwright/test';

/** The seeded newsroom accounts (projects/api/prisma/seed.ts). */
export const JOURNALIST = { email: 'jane.uwase@frameafrica.rw', password: 'DevPass123!' };
export const EDITOR = { email: 'eric.mugisha@frameafrica.rw', password: 'DevPass123!' };
export const ADMIN = { email: 'admin@frameafrica.rw', password: 'DevPass123!' };

/** Sign in and land on the account page — where the site sends every reader. */
export async function signIn(page: Page, user = JOURNALIST): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  // By name, not by label: the footer's newsletter box also has an email field.
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Generous: against a dev server this is often the first hit on /account, and
  // the route is compiled on demand while several workers are already busy.
  await page.waitForURL(/\/account/, { timeout: 45_000 });
}
