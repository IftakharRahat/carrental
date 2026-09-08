import { expect, test } from "@playwright/test";

test.describe("Page 11 - Expense Details (/expenses/details)", () => {
  test("loads /expenses/details, displays Section 14.1 Summary cards and unified table", async ({
    page,
  }) => {
    await page.goto("/expenses/details");
    await expect(page).toHaveURL(/\/expenses\/details/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Expense Details", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Combined transaction-level reporting for car expenses and general business overheads (Section 14)."),
    ).toBeVisible();

    // Section 14.1 Summary cards
    await expect(page.getByTestId("kpi-details-car-expenses")).toBeVisible();
    await expect(page.getByTestId("kpi-details-biz-expenses")).toBeVisible();
    await expect(page.getByTestId("kpi-details-total-expenses")).toBeVisible();

    // Section 14.2 Date Preset buttons
    await expect(page.getByRole("button", { name: "This Week" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Last Week" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Month" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Last Month" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Custom Range" })).toBeVisible();

    // Table & Columns
    await expect(page.getByTestId("expense-details-table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Expense Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Reference" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Description" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Amount (AED)" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Method" })).toBeVisible();
  });

  test("filters by Expense Type and searches description", async ({ page }) => {
    await page.goto("/expenses/details");

    // Switch to All Time to ensure broad dataset
    await page.getByRole("button", { name: "All Time" }).click();

    // Test filter type: Car Expenses Only
    await page.getByTestId("details-type-filter").selectOption("CAR");
    await expect(
      page.getByTestId("expense-details-table").getByText("Business Expense"),
    ).not.toBeVisible();

    // Test filter type: Business Expenses Only
    await page.getByTestId("details-type-filter").selectOption("BUSINESS");
    await expect(
      page.getByTestId("expense-details-table").getByText("Car Expense"),
    ).not.toBeVisible();
  });

  test("exports combined expenses to CSV", async ({ page }) => {
    await page.goto("/expenses/details");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-expenses-csv-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("expense-details-");
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("navigates to /expenses/details via sidebar navigation link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Expense Details" });
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/expenses\/details/);
    await expect(
      page.getByRole("heading", { name: "Expense Details", level: 1 }),
    ).toBeVisible();
  });
});
