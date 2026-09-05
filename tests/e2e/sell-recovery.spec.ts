import { expect, test } from "@playwright/test";

test.describe("Page 5 - Sell / Recovery (/sell)", () => {
  test("loads /sell page, verifies mode selector, live summary in AED, and quick add buyer modal", async ({
    page,
  }) => {
    // 1. Direct navigation to /sell
    await page.goto("/sell");
    await expect(page).toHaveURL(/\/sell/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Sell / Recovery", level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText("Record revenue from a whole-car sale or individual dismantled items.")
    ).toBeVisible();

    // 8.1 Mode Selector tabs
    const wholeCarTab = page.getByRole("tab", { name: /Whole Car Sale/i });
    const itemSaleTab = page.getByRole("tab", { name: /Dismantle \/ Item Sale/i });
    await expect(wholeCarTab).toBeVisible();
    await expect(itemSaleTab).toBeVisible();

    // 8.5 Live Recovery Summary Card exists
    await expect(page.getByText("Live Recovery Summary")).toBeVisible();
    await expect(page.getByText(/Total Investment/i).first()).toBeVisible();
    await expect(page.getByText(/Current Recovery/i).first()).toBeVisible();
    await expect(page.getByText(/Realized Car Profit/i)).toBeVisible();

    // Entering a selling price dynamically renders Projected Recovery
    await page.getByLabel(/Selling Price/i).fill("25000");
    await expect(page.getByText(/Projected Recovery/i)).toBeVisible();

    // Verify Whole Car Sale Form inputs
    await expect(page.getByLabel(/Sale Date/i)).toBeVisible();
    await expect(page.getByLabel(/Selling Price/i)).toBeVisible();
    await expect(page.getByLabel(/Payment Method/i)).toBeVisible();

    // Check Quick Add Buyer dialog opens and closes
    const quickAddBuyerBtn = page.getByTestId("quick-add-buyer-btn");
    if (await quickAddBuyerBtn.isVisible().catch(() => false)) {
      await quickAddBuyerBtn.click();
      await expect(
        page.getByRole("heading", { name: "Add New Buyer" })
      ).toBeVisible();
      await expect(page.getByLabel("Buyer Name *")).toBeVisible();
      // Close dialog
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(
        page.getByRole("heading", { name: "Add New Buyer" })
      ).not.toBeVisible();
    }

    // Switch to Dismantle / Item Sale mode
    await itemSaleTab.click();
    await expect(page.getByLabel(/Item/i).first()).toBeVisible();
    await expect(page.getByLabel(/Amount/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Record Item Sale" })).toBeVisible();

    // Switch back to Whole Car Sale mode
    await wholeCarTab.click();
    await expect(
      page.getByRole("button", { name: /Record Whole Car Sale/i })
    ).toBeVisible();
  });

  test("sidebar navigation links directly to /sell", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Desktop sidebar is hidden on mobile viewports");
    await page.goto("/");
    const sellNavLink = page.getByRole("link", { name: /Sell \/ Recovery/i });
    await expect(sellNavLink).toBeVisible();
    await sellNavLink.click();
    await expect(page).toHaveURL(/\/sell/);
  });

  test("car details Sell / Recovery header button preselects car in /sell", async ({
    page,
  }) => {
    await page.goto("/stock");
    const carLink = page.locator("a[href^='/cars/CAR-']").first();
    const hasCar = await carLink.isVisible().catch(() => false);

    if (hasCar) {
      await carLink.click();
      await expect(page).toHaveURL(/\/cars\/CAR-\d+/);

      const sellBtn = page.getByTestId("sell-recovery-header-btn");
      await expect(sellBtn).toBeVisible();
      await sellBtn.click();

      // Should land on /sell?carId=CAR-XXXX
      await expect(page).toHaveURL(/\/sell\?carId=CAR-\d+/);
      await expect(page.getByRole("heading", { name: "Sell / Recovery" })).toBeVisible();
      // Vehicle details summary card should be active
      await expect(page.getByText("Live Recovery Summary")).toBeVisible();
    }
  });
});
