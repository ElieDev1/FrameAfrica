import { expect, test } from '@playwright/test';

/**
 * Critical reader journeys — the paths that must never break on a release
 * (documents/08 §E2E). These run against a live, seeded stack.
 */

test('homepage loads and opens a story', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('header')).toBeVisible();

  // The masthead brand and section nav render.
  await expect(page.getByRole('navigation', { name: /sections/i })).toBeVisible();

  // Open the first article and confirm the article page renders.
  const firstStory = page.locator('a[href^="/article/"]').first();
  await expect(firstStory).toBeVisible();
  await firstStory.click();

  await expect(page).toHaveURL(/\/article\//);
  await expect(page.locator('article h1')).toBeVisible();
});

test('search returns relevant results', async ({ page }) => {
  await page.goto('/search?q=rwanda', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/results? for/i)).toBeVisible();
  await expect(page.locator('h2')).not.toHaveCount(0);
});

test('a section page lists stories', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const sectionLink = page.locator('a[href^="/section/"]').first();
  await sectionLink.click();
  await expect(page).toHaveURL(/\/section\//);
  await expect(page.locator('h1')).toBeVisible();
});
