import { expect, test } from "@playwright/test";

test.describe("Page 13 - Business Analytics (/analytics)", () => {
  test("loads /analytics, displays Section 16 Overview KPI cards and tab navigation", async ({
    page,
  }) => {
    await page.goto("/analytics");
    await expect(page).toHaveURL(/\/analytics/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Business Analytics", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Analyze buying and recovery performance across brands, conditions, sources, and buyers."),
    ).toBeVisible();

    // Overview KPI cards
    await expect(page.getByTestId("kpi-analytics-bought")).toBeVisible();
    await expect(page.getByTestId("kpi-analytics-investment")).toBeVisible();
    await expect(page.getByTestId("kpi-analytics-profit")).toBeVisible();
    await expect(page.getByTestId("kpi-analytics-avg-profit")).toBeVisible();
    await expect(page.getByTestId("kpi-analytics-turnaround")).toBeVisible();

    // Segmented tab buttons
    await expect(page.getByTestId("tab-brands")).toBeVisible();
    await expect(page.getByTestId("tab-conditions")).toBeVisible();
    await expect(page.getByTestId("tab-sources")).toBeVisible();
    await expect(page.getByTestId("tab-buyers")).toBeVisible();
  });

  test("toggles between Brand, Condition, Source, and Buyer analytics", async ({
    page,
  }) => {
    await page.goto("/analytics");

    // 1. Brands Tab (default)
    await expect(page.getByTestId("table-brands")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Brand" })).toBeVisible();

    // 2. Conditions Tab
    await page.getByTestId("tab-conditions").click();
    await expect(page.getByTestId("table-conditions")).toBeVisible();
    await expect(page.getByText("Scrap", { exact: true })).toBeVisible();
    await expect(page.getByText("Accident / Damaged")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Avg Days in Stock" })).toBeVisible();

    // 3. Sources Tab
    await page.getByTestId("tab-sources").click();
    await expect(page.getByTestId("table-sources")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Capital Sourced (AED)" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Commission Paid (AED)" })).toBeVisible();

    // 4. Buyers Tab
    await page.getByTestId("tab-buyers").click();
    await expect(page.getByText("Buyer Category Distribution")).toBeVisible();
    await expect(page.getByTestId("table-buyers")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Buyer Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Avg Ticket (AED)" })).toBeVisible();
  });

  test("exports analytics report to CSV", async ({ page }) => {
    await page.goto("/analytics");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-analytics-csv-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("business-analytics-");
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("navigates to /analytics via sidebar navigation link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Analytics" });
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/analytics/);
    await expect(
      page.getByRole("heading", { name: "Business Analytics", level: 1 }),
    ).toBeVisible();
  });
});
