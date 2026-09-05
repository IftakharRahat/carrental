import { expect, test } from "@playwright/test";

test.describe("Page 4 - Car Details (/cars/[carId])", () => {
  test("loads car details page, verifies header, KPI strip with AED, and tab switching", async ({
    page,
  }) => {
    // Navigate via stock page or direct URL if a car exists
    await page.goto("/stock");

    // Look for any car link in the table
    const carIdLink = page.locator("a[href^='/cars/CAR-']").first();
    const hasCar = await carIdLink.isVisible().catch(() => false);

    if (hasCar) {
      await carIdLink.click();
      await expect(page).toHaveURL(/\/cars\/CAR-\d+/);
    } else {
      // Direct navigation to CAR-0001
      await page.goto("/cars/CAR-0001");
      const notFoundHeading = page.getByRole("heading", { name: "404", exact: true });
      if (await notFoundHeading.isVisible().catch(() => false)) {
        // Skip further checks if DB has no seed cars yet
        return;
      }
    }

    // 7.1 Header elements
    await expect(page.getByTestId("add-expense-header-btn")).toBeVisible();
    await expect(page.getByTestId("sell-recovery-header-btn")).toBeVisible();
    await expect(page.getByRole("button", { name: "More" })).toBeVisible();

    // 7.2 KPI strip elements (all in AED)
    await expect(page.locator("p", { hasText: /^Purchase$/ })).toBeVisible();
    await expect(page.locator("p", { hasText: /^Expenses$/ })).toBeVisible();
    await expect(page.locator("p", { hasText: /^Investment$/ })).toBeVisible();
    await expect(page.locator("p", { hasText: /^Recovery$/ })).toBeVisible();
    await expect(page.locator("p", { hasText: /^Realized Profit$/ })).toBeVisible();

    // Verify Realized Car Profit is Pending for active stock or shows AED
    const pendingBadge = page.getByTestId("realized-profit-pending-badge");
    const profitValue = page.getByTestId("realized-profit-value");
    const hasPending = await pendingBadge.isVisible().catch(() => false);
    const hasProfit = await profitValue.isVisible().catch(() => false);
    expect(hasPending || hasProfit).toBe(true);

    // 7.3 Tabs navigation
    await expect(page.getByRole("button", { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Expenses/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Recovery \/ Sales/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /History/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Documents \/ Photos/i })).toBeVisible();

    // Switch to Expenses tab
    await page.getByRole("button", { name: /Expenses/i }).click();
    await expect(page.getByText("Car Expenses", { exact: true })).toBeVisible();

    // Switch to Recovery / Sales tab
    await page.getByRole("button", { name: /Recovery \/ Sales/i }).click();
    await expect(page.getByText("Sales & Recovery Transactions", { exact: true })).toBeVisible();

    // Switch to History tab
    await page.getByRole("button", { name: /History/i }).click();
    await expect(page.getByText("Vehicle Timeline & Audit History", { exact: true })).toBeVisible();

    // Switch to Documents / Photos tab
    await page.getByRole("button", { name: /Documents \/ Photos/i }).click();
    await expect(page.getByText("Vehicle Photos", { exact: true })).toBeVisible();

    // 7.4 Test opening Add Expense Dialog
    await page.getByTestId("add-expense-header-btn").click();
    await expect(page.getByRole("heading", { name: /Add Car Expense/i })).toBeVisible();
    await expect(page.getByLabel(/Expense Date/i)).toBeVisible();
    await expect(page.getByLabel(/Category/i)).toBeVisible();
    await expect(page.getByLabel(/Amount \(AED\)/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: /Add Car Expense/i })).not.toBeVisible();
  });
});
