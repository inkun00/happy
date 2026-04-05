import { test, expect } from "@playwright/test";

test.describe("스모크", () => {
  test("주요 탭·프로필·수신인 화면", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "행복루틴", exact: true }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "주요 메뉴" })
      .getByRole("link", { name: "미션" })
      .click();
    await expect(page).toHaveURL(/\/missions$/);
    await expect(
      page.getByRole("heading", { name: "미션", exact: true }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "주요 메뉴" })
      .getByRole("link", { name: "상점" })
      .click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(
      page.getByRole("heading", { name: "선물 상점" }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "주요 메뉴" })
      .getByRole("link", { name: "프로필" })
      .click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole("heading", { name: "프로필", exact: true }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "선물 받는 사람 관리" })
      .click();
    await expect(page).toHaveURL(/\/recipients$/);
    await expect(
      page.getByRole("heading", { name: "선물 받는 사람" }),
    ).toBeVisible();
  });
});
