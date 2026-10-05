import { expect, test } from '@playwright/test';

// Marketing pages ship no JS at all, so none of the game can leak onto them (see CLAUDE.md).
for (const path of ['/', '/blog']) {
  test(`${path} loads without any scripts`, async ({ page }) => {
    const scriptUrls: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scriptUrls.push(request.url());
    });

    const response = await page.goto(path);

    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('script')).toHaveCount(0);
    expect(scriptUrls).toEqual([]);
  });
}
