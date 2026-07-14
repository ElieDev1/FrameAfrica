import { expect, test } from '@playwright/test';
import { JOURNALIST, signIn } from './helpers';

/**
 * Signing in is the gate to everything a member of staff does, so it gets its
 * own spec. The credentials are the seeded newsroom accounts (prisma/seed.ts).
 */

test('a journalist signs in and reaches the newsroom', async ({ page }) => {
  await signIn(page);

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  // The dashboard is behind the session cookie: arriving here at all is the assertion.
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('a wrong password is refused, and says so', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(JOURNALIST.email);
  await page.locator('input[name="password"]').fill('definitely-not-the-password');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login/); // and we are still outside
});

test('the newsroom is closed to someone who is not signed in', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/);
});
