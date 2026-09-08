import { expect, test } from "@playwright/test";

test.describe("Page 12 - Monthly Report (/reports/monthly)", () => {
  test("loads /reports/monthly, displays Section 15.1 metrics and Section 15.2 month-end snapshot", async ({
    page,
  }) => {
    await page.goto("/reports/monthly");
    await expect(page).toHaveURL(/\/reports\/monthly/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Monthly Report", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("View each month separately and preserve month-end business snapshots (Section 15)."),
    ).toBeVisible();

    // Section 15.2 Month-End Closing References
    await expect(page.getByTestId("kpi-closing-stock-cars")).toBeVisible();
    await expect(page.getByTestId("kpi-closing-stock-value")).toBeVisible();
    await expect(page.getByTestId("kpi-closing-cash")).toBeVisible();

    // Section 15.1 Monthly Metrics
    await expect(page.getByTestId("kpi-cars-bought")).toBeVisible();
    await expect(page.getByTestId("kpi-cars-completed")).toBeVisible();
    await expect(page.getByTestId("kpi-expenses")).toBeVisible();
    await expect(page.getByTestId("kpi-profit")).toBeVisible();

    // Month Selector
    await expect(page.getByTestId("month-year-selector")).toBeVisible();

    // Save / Regenerate Snapshot Button
    await expect(page.getByTestId("save-snapshot-btn")).toBeVisible();
  });

  test("saves or regenerates a month-end snapshot", async ({ page }) => {
    await page.goto("/reports/monthly");

    const saveBtn = page.getByTestId("save-snapshot-btn");
    await expect(saveBtn).toBeVisible();

    // Click to save/regenerate snapshot
    await saveBtn.click();

    // Toast or banner confirmation appears
    await expect(
      page.getByText(/snapshot (saved|regenerated|preserved)/i).first(),
    ).toBeVisible();
  });

  test("toggles breakdown tabs: Completed Cars, Purchases, and Expenses", async ({
    page,
  }) => {
    await page.goto("/reports/monthly");

    // Click Purchases tab
    await page.getByTestId("tab-purchases").click();
    await expect(page.getByRole("columnheader", { name: "Seller" })).toBeVisible();

    // Click Expense Breakdown tab
    await page.getByTestId("tab-expenses").click();
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();

    // Click Completed Cars tab
    await page.getByTestId("tab-completed-cars").click();
    await expect(page.getByRole("columnheader", { name: "Days in Stock" })).toBeVisible();
  });

  test("exports monthly report to CSV", async ({ page }) => {
    await page.goto("/reports/monthly");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-monthly-csv-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("monthly-report-");
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("navigates to /reports/monthly via sidebar navigation link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Monthly Report" });
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/reports\/monthly/);
    await expect(
      page.getByRole("heading", { name: "Monthly Report", level: 1 }),
    ).toBeVisible();
  });
});
