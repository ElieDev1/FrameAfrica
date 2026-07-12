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

  // Open the first article and confirm the article page renders. Scope to the
  // page body and to visible links: the header's section menus each carry a
  // featured-article link, but they are closed (hidden) until hovered, so a
  // bare `.first()` would grab header chrome rather than a story.
  const firstStory = page.locator('main a[href^="/article/"]:visible').first();
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
