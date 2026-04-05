import { test, expect } from "@playwright/test";

test.describe("인증 화면", () => {
  test("존재하지 않는 미션 ID는 안내 후 목록으로 이동 가능", async ({
    page,
  }) => {
    await page.goto("/verify/__no_such_mission__");
    await expect(page).toHaveURL(/\/verify\/__no_such_mission__$/);
    await expect(page.getByRole("alert")).toHaveText("미션을 찾을 수 없어요");
    await page.getByRole("link", { name: "미션 목록으로" }).click();
    await expect(page).toHaveURL(/\/missions$/);
    await expect(
      page.getByRole("heading", { name: "미션", exact: true }),
    ).toBeVisible();
  });
});
