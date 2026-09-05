import { expect, test } from "@playwright/test";

test.describe("Page 6 - Sources (/sources)", () => {
  test("loads /sources, displays KPI cards, category filter buttons, and opens Add Source modal", async ({
    page,
  }) => {
    await page.goto("/sources");

    // Page title and description
    await expect(
      page.getByRole("heading", { name: "Sources", exact: true }),
    ).toBeVisible();

    // KPI Cards
    await expect(page.getByTestId("kpi-active-sources")).toBeVisible();
    await expect(page.getByTestId("kpi-cars-bought")).toBeVisible();
    await expect(page.getByTestId("kpi-purchase-value")).toBeVisible();
    await expect(page.getByTestId("kpi-commission-paid")).toBeVisible();

    // Category filter pills
    await expect(page.getByRole("button", { name: "All Categories" })).toBeVisible();
    await expect(page.getByRole("button", { name: "People" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Online" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Offline" })).toBeVisible();

    // Table
    await expect(page.getByTestId("sources-table")).toBeVisible();

    // Open Add Source Dialog
    const addBtn = page.getByRole("button", { name: /Add Source/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(
      page.getByRole("heading", { name: /Add New Source/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("creates a new source and records a commission payout on their profile", async ({
    page,
  }) => {
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const sourceName = `Al Barsha Garage ${uniqueSuffix}`;

    await page.goto("/sources");

    // Click Add Source
    await page.getByRole("button", { name: /Add Source/i }).click();

    // Fill form
    await page.getByLabel(/Source \/ Channel Name/i).fill(sourceName);
    await page.getByLabel(/Phone Number/i).fill(`+971 50 888 ${uniqueSuffix}`);
    await page.getByLabel(/WhatsApp/i).fill(`+971 50 888 ${uniqueSuffix}`);
    await page.getByLabel(/Location \/ Area/i).fill("Al Barsha, Dubai");

    // Submit
    await page.getByRole("button", { name: "Add Source", exact: true }).click();

    // Verify toast confirmation and source in table
    await expect(page.getByText(/added successfully/i)).toBeVisible();
    const sourceLink = page.getByRole("link", { name: sourceName });
    await expect(sourceLink).toBeVisible();

    // Navigate to profile
    await sourceLink.click();
    await expect(page).toHaveURL(/\/sources\/[0-9a-f-]+/);

    // Verify profile heading and KPIs
    await expect(
      page.getByRole("heading", { name: sourceName, exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("kpi-total-leads")).toBeVisible();
    await expect(page.getByTestId("kpi-cars-bought")).toBeVisible();
    await expect(page.getByTestId("kpi-purchase-value")).toBeVisible();
    await expect(page.getByTestId("kpi-commission-paid")).toBeVisible();
    await expect(page.getByTestId("kpi-last-deal")).toBeVisible();

    // Pay commission modal
    const payCommBtn = page.getByRole("button", { name: /Pay Commission/i }).first();
    await expect(payCommBtn).toBeVisible();
    await payCommBtn.click();

    await expect(page.getByRole("heading", { name: /Pay Commission/i })).toBeVisible();
    await page.getByLabel(/Commission Amount/i).fill("750");
    await page.getByLabel(/Notes \/ Reference/i).fill("Referral commission test");

    await page.getByRole("button", { name: "Record Commission" }).click();

    // Commission payout appears in table
    const commTable = page.getByTestId("source-commissions-table");
    await expect(commTable).toBeVisible();
    await expect(commTable.getByText("AED 750.00")).toBeVisible();

    // Back to sources
    await page.getByRole("link", { name: "Back to Sources" }).click();
    await expect(page).toHaveURL(/\/sources/);
  });

  test("sidebar navigation links directly to /sources", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Desktop sidebar is hidden on mobile viewports");
    await page.goto("/");
    const navLink = page.getByRole("link", { name: /Sources/i });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/sources/);
  });
});
