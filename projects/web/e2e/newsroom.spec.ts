import { expect, test } from '@playwright/test';
import { EDITOR, signIn } from './helpers';

/**
 * The workflow the whole newsroom rests on: a journalist writes a draft and
 * submits it; it clears the copy desk; an editor publishes it; a reader can read
 * it. If this breaks, nothing else about the product matters.
 *
 * It runs as one serial story because each step depends on the last.
 */
test.describe.configure({ mode: 'serial' });

// A unique headline per run, so a re-run never collides with the last one's slug.
const HEADLINE = `E2E test story ${Date.now()}`;
const PARAGRAPH =
  'This story was written by the end-to-end suite to prove that a draft can travel from a ' +
  'journalist through the copy desk to an editor and reach a reader without anyone touching ' +
  'the database.';

test('a journalist writes a draft and submits it', async ({ page }) => {
  await signIn(page); // Jane Uwase, journalist

  await page.goto('/dashboard/stories/new', { waitUntil: 'domcontentloaded' });

  await page.getByPlaceholder(/write the headline/i).fill(HEADLINE);
  await page.getByRole('combobox').first().selectOption({ index: 1 }); // a section

  // The body is a block document. A fresh draft may already open with an empty
  // paragraph; if it doesn't, add one.
  const paragraph = page.getByPlaceholder(/write a paragraph/i).first();
  if ((await paragraph.count()) === 0) {
    await page
      .getByRole('button', { name: /paragraph/i })
      .first()
      .click();
  }
  await page
    .getByPlaceholder(/write a paragraph/i)
    .first()
    .fill(PARAGRAPH);

  await page.getByRole('button', { name: /create draft/i }).click();

  // A saved draft has an id of its own — the page for it.
  await page.waitForURL(/\/dashboard\/stories\/[0-9a-f-]{16,}/, { timeout: 45_000 });

  await page.getByRole('button', { name: /submit for review/i }).click();
  // It leaves the writer's hands: the submit button is gone once it is filed.
  await expect(page.getByRole('button', { name: /submit for review/i })).toHaveCount(0, {
    timeout: 15_000,
  });
});

test('the copy desk passes it to the editors', async ({ page }) => {
  await signIn(page, EDITOR); // an editor also works the copy desk

  await page.goto('/dashboard/copydesk', { waitUntil: 'domcontentloaded' });
  const story = page.getByRole('link', { name: HEADLINE }).first();
  await expect(story).toBeVisible({ timeout: 15_000 });
  await story.click();

  await page.waitForURL(/\/dashboard\/copydesk\/[0-9a-f-]{16,}/, { timeout: 20_000 });
  await page.getByRole('button', { name: /pass to editors/i }).click();

  await page.waitForURL(/\/dashboard\/copydesk\/?$/, { timeout: 20_000 });
});

test('an editor finds it in the queue and publishes it', async ({ page }) => {
  await signIn(page, EDITOR);

  await page.goto('/dashboard/review', { waitUntil: 'domcontentloaded' });
  const row = page.locator('li').filter({ hasText: HEADLINE }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });

  await row.getByRole('button', { name: /publish now/i }).click();
  // Publishing is not undoable in one click, so it asks first.
  await page
    .getByRole('button', { name: /publish now/i })
    .last()
    .click();

  // Once it is out, it is no longer awaiting review.
  await expect(page.locator('li').filter({ hasText: HEADLINE })).toHaveCount(0, {
    timeout: 20_000,
  });
});

test('and a reader can read it', async ({ page }) => {
  await page.goto(`/search?q=${encodeURIComponent('E2E test story')}`, {
    waitUntil: 'domcontentloaded',
  });

  const link = page.getByRole('link', { name: HEADLINE }).first();
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click();

  await expect(page.locator('article h1')).toContainText(HEADLINE);
  await expect(page.getByText(PARAGRAPH.slice(0, 40))).toBeVisible();
});
