import { test, expect } from "@playwright/test";

test.describe("홈", () => {
  test("루틴 카드에 API 헬스 안내가 표시됨", async ({ page }) => {
    await page.goto("/");
    const line = page.locator("#home-api-health");
    await expect(line).toBeVisible();
    await expect(line).toContainText("백엔드·DB 정상", { timeout: 20_000 });
  });
});
