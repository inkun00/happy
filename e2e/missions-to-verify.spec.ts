import { test, expect } from "@playwright/test";

test.describe("미션 흐름", () => {
  test("목록에서 음성 미션으로 진입", async ({ page }) => {
    await page.goto("/missions");
    await expect(
      page.getByRole("heading", { name: "미션", exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: /칭찬하기/ }).click();
    await expect(page).toHaveURL(/\/verify\/compliment$/);
    await expect(
      page.getByRole("banner", { name: "미션 인증" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "«고마워», «사랑해» 같은 말을 말해 보세요",
        level: 1,
      }),
    ).toBeVisible();
  });
});
