import { test, expect } from "@playwright/test";

test.describe("인증 화면", () => {
  test("위치 미션은 카메라 없이 UI 로드", async ({ page }) => {
    await page.goto("/verify/local-visit");
    await expect(page).toHaveURL(/\/verify\/local-visit$/);
    await expect(
      page.getByRole("banner", { name: "미션 인증" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "지정 구역에 도착하면 인증됩니다",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "현재 위치로 인증" }),
    ).toBeVisible();
  });
});
