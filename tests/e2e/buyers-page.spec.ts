import { expect, test } from "@playwright/test";

test.describe("Page 8 - Buyers (/buyers)", () => {
  test("loads /buyers, displays KPI cards, filter toolbar, and opens Add Buyer modal", async ({
    page,
  }) => {
    // 1. Direct navigation to /buyers
    await page.goto("/buyers");
    await expect(page).toHaveURL(/\/buyers/);

    // Header validation
    await expect(page.getByRole("heading", { name: "Buyers", level: 1 })).toBeVisible();
    await expect(
      page.getByText("Store whole-car and item buyers and analyze buyer activity.")
    ).toBeVisible();

    // Primary action button
    const addBuyerBtn = page.getByTestId("add-buyer-btn");
    await expect(addBuyerBtn).toBeVisible();

    // Summary KPI cards
    await expect(page.getByText("Total Buyers")).toBeVisible();
    await expect(page.getByText("Active Buyers")).toBeVisible();
    await expect(page.getByText("Total Recovered")).toBeVisible();
    await expect(page.getByText("Avg. Purchase / Buyer")).toBeVisible();

    // Search and filters
    await expect(page.getByTestId("search-buyers-input")).toBeVisible();
    await expect(page.getByRole("button", { name: "All Categories" })).toBeVisible();

    // Section 11.1 standard category pills
    await expect(page.getByRole("button", { name: "Whole Car / Body" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Engine" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Scrap" })).toBeVisible();

    // Test opening Add Buyer dialog
    await addBuyerBtn.click();
    await expect(page.getByRole("heading", { name: "Add New Buyer" })).toBeVisible();
    await expect(page.getByLabel("Buyer Name *")).toBeVisible();
    await expect(page.getByText("Buyer Type(s) (Multi-Select)")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Add New Buyer" })).not.toBeVisible();
  });

  test("creates a new buyer with multi-select categories and views their profile", async ({
    page,
  }) => {
    await page.goto("/buyers");

    // Open modal
    await page.getByTestId("add-buyer-btn").click();

    const timestamp = Date.now().toString().slice(-4);
    const uniqueBuyerName = `Emirates Auto Parts ${timestamp}`;

    await page.getByLabel("Buyer Name *").fill(uniqueBuyerName);
    await page.getByLabel("Company / Shop").fill("Emirates Scrap Yard");
    await page.getByLabel("Primary Phone").fill("+971 52 345 6789");
    await page.getByLabel("Location / Yard").fill("Sajaa, Sharjah");
    await page.getByLabel("Notes (Optional)").fill("Specialist in Japanese engines and bodies");

    // Multi-select categories: click Whole Car / Body and Engine
    await page.locator("form").getByRole("button", { name: "Whole Car / Body" }).click();
    await page.locator("form").getByRole("button", { name: "Engine" }).click();

    // Submit
    await page.getByRole("button", { name: "Create Buyer" }).click();

    // Verify buyer appears in table
    const buyerLink = page.getByRole("link", { name: uniqueBuyerName });
    await expect(buyerLink).toBeVisible();

    // Click to navigate to dedicated Section 11.3 profile page (/buyers/[buyerId])
    await buyerLink.click();
    await expect(page).toHaveURL(/\/buyers\/[0-9a-f-]+/);

    // Section 11.3 Summary Cards
    await expect(page.getByTestId("kpi-total-purchases")).toBeVisible();
    await expect(page.getByTestId("kpi-total-amount")).toBeVisible();
    await expect(page.getByTestId("kpi-last-purchase")).toBeVisible();

    // Verify profile details
    await expect(page.getByRole("heading", { name: uniqueBuyerName })).toBeVisible();
    await expect(page.getByText("Emirates Scrap Yard")).toBeVisible();
    await expect(page.getByText("+971 52 345 6789")).toBeVisible();
    await expect(page.getByText("Sajaa, Sharjah")).toBeVisible();

    // Verify transaction history section
    await expect(page.getByText("Transaction History")).toBeVisible();
    await expect(page.getByTestId("buyer-transactions-table")).toBeVisible();

    // Back to buyers
    await page.getByRole("link", { name: "Back to Buyers" }).click();
    await expect(page).toHaveURL(/\/buyers/);
  });

  test("sidebar navigation links directly to /buyers", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Desktop sidebar is hidden on mobile viewports");
    await page.goto("/");
    const buyersNavLink = page.getByRole("link", { name: /Buyers/i });
    await expect(buyersNavLink).toBeVisible();
    await buyersNavLink.click();
    await expect(page).toHaveURL(/\/buyers/);
  });
});
