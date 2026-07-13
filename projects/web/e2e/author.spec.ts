import { expect, test } from '@playwright/test';

/** A byline has to lead to the person who stands behind the story. */
test('a byline leads to the author, and the author to their stories', async ({ page }) => {
  await page.goto('/article/kigali-green-transport-plan', { waitUntil: 'domcontentloaded' });

  const byline = page.locator('article a[href^="/author/"]').first();
  await expect(byline).toBeVisible();
  await byline.click();

  await expect(page).toHaveURL(/\/author\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Their work, not just their name. Scoped to the page body: the header's
  // section menus carry article links too, but they are hidden until hovered.
  await expect(page.locator('main a[href^="/article/"]:visible').first()).toBeVisible();
});

test('an author page that nobody has published is not found', async ({ page }) => {
  // A reader's account carries a slug too, so an unpublished one must lead
  // nowhere — never to an empty profile that confirms the account exists.
  await page.goto('/author/definitely-not-a-journalist', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  await expect(page.locator('main a[href^="/article/"]')).toHaveCount(0);
});
