import { expect, test } from "@playwright/test";

test("shows the project foundation status", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Project setup is ready" }),
  ).toBeVisible();
  await expect(page.getByText("Neon PostgreSQL", { exact: true })).toBeVisible();
});
