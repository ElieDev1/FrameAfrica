import { expect, test } from '@playwright/test';

/**
 * The paywall is where the business lives: a premium story must stop an
 * unsubscribed reader, and it must always offer them a way through. A paywall
 * with no route to a plan is just a broken page.
 */

/** A premium story from the seed (prisma/seed.ts). */
const PREMIUM = '/article/central-bank-holds-key-rate';

test('a premium story stops an unsubscribed reader and offers the plans', async ({ page }) => {
  await page.goto(PREMIUM, { waitUntil: 'domcontentloaded' });

  // The headline is public — the story is not.
  await expect(page.locator('article h1')).toBeVisible();

  const paywall = page.getByRole('link', { name: /plans|subscribe/i }).first();
  await expect(paywall).toBeVisible();
  await paywall.click();

  await expect(page).toHaveURL(/\/pricing/);
});

test('the pricing page lists what a subscription costs', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // At least one plan, each with a way to take it.
  await expect(
    page.getByRole('button', { name: /subscribe|choose|continue/i }).first(),
  ).toBeVisible();
});

test('a story that is not premium reads in full, with no wall', async ({ page }) => {
  // A free story from the same seed — the contrast is the point.
  await page.goto('/article/kigali-green-transport-plan', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('article h1')).toBeVisible();
  await expect(page.getByText(/subscribe to keep reading/i)).toHaveCount(0);
});
