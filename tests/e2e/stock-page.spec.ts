import { expect, test } from "@playwright/test";

test.describe("Stock Page (/stock)", () => {
  test("renders the stock page shell, summary cards, filters, and table", async ({
    page,
  }) => {
    await page.goto("/stock");

    // Header & Primary action
    await expect(
      page.getByRole("heading", { name: "Stock", exact: true }),
    ).toBeVisible();
    const buyCarBtn = page.getByTestId("buy-car-header-btn");
    await expect(buyCarBtn).toBeVisible();
    await expect(buyCarBtn).toHaveAttribute("href", "/cars/new");

    // 6.1 Summary cards
    await expect(page.getByText("Active Cars", { exact: true })).toBeVisible();
    await expect(page.getByText("Stock Value", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Recovered from Active Stock", { exact: true }),
    ).toBeVisible();

    // Verify AED currency in summary cards
    const summaryCards = page.locator(".grid.gap-4.sm\\:grid-cols-3");
    await expect(summaryCards).toContainText("AED");

    // 6.2 Filter toolbar
    await expect(page.getByPlaceholder(/Search Car ID/i)).toBeVisible();
    await expect(page.getByText("Include Completed")).toBeVisible();

    // 6.3 Stock Table columns
    await expect(
      page.getByRole("columnheader", { name: "Car ID" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Car", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Condition" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Purchase Price" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Total Expenses" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Total Investment" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Recovery" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Remaining / Pending" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Days in Stock" }),
    ).toBeVisible();
  });

  test("navigates to /stock via the app sidebar navigation", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");

    const stockNavLink = page.getByRole("link", { name: "Stock", exact: true });
    await expect(stockNavLink).toBeVisible();
    await stockNavLink.click();

    await expect(page).toHaveURL(/\/stock/);
    await expect(
      page.getByRole("heading", { name: "Stock", exact: true }),
    ).toBeVisible();
  });

  test("navigates to /cars via the All Cars sidebar link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");

    const allCarsNavLink = page.getByRole("link", { name: "All Cars", exact: true });
    await expect(allCarsNavLink).toBeVisible();
    await allCarsNavLink.click();

    await expect(page).toHaveURL(/\/cars$/);
    await expect(
      page.getByRole("heading", { name: "All Cars", exact: true }),
    ).toBeVisible();
  });

  test("clicking primary Buy Car button navigates to /cars/new", async ({
    page,
  }) => {
    await page.goto("/stock");

    const buyCarBtn = page.getByTestId("buy-car-header-btn");
    await buyCarBtn.click();

    await expect(page).toHaveURL(/\/cars\/new/);
    await expect(page.getByRole("heading", { name: "Buy Car" })).toBeVisible();
  });
});
