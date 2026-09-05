import { expect, test } from "@playwright/test";

test("shows the project foundation status", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Project setup is ready" }),
  ).toBeVisible();
  await expect(
    page.getByText("Neon PostgreSQL", { exact: true }),
  ).toBeVisible();
});

test("shows the complete Buy Car form and initial investment summary", async ({
  page,
}) => {
  await page.goto("/cars/new");

  await expect(page.getByRole("heading", { name: "Buy Car" })).toBeVisible();
  await expect(page.getByText("Basic information")).toBeVisible();
  await expect(page.getByText("Purchase summary")).toBeVisible();
  const expenseSummary = page
    .getByText("Car expenses", { exact: true })
    .locator("..");
  await expect(expenseSummary).toContainText("AED 0.00");
  await expect(page.getByRole("button", { name: "Save Car" })).toBeVisible();
});
