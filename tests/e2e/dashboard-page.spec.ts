import "dotenv/config";
import { expect, test } from "@playwright/test";
import { signToken } from "../../src/lib/auth/jwt";

test.describe("Page 1 - Dashboard (/dashboard)", () => {
  test.beforeEach(async ({ context }) => {
    const token = await signToken({
      profileId: "2104ba2c-56a7-4eb4-ac2e-d931946503cc",
      email: "admin@carscrap.ae",
      name: "Administrator",
      role: "ADMIN",
    });

    await context.addCookies([
      {
        name: "session",
        value: token,
        url: "http://localhost:3107",
      },
    ]);
  });

  test("loads /dashboard, displays Section 4.1 header, 4.2 Overall KPIs, and 4.3 This Month panel", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // 4.1 Header validation
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    await expect(page.getByText(/Refreshed:/i)).toBeVisible();

    // 4.2 Overall KPI cards presence
    await expect(page.getByText("Total Capital")).toBeVisible();
    await expect(page.getByText("Available Cash")).toBeVisible();
    await expect(page.getByText("Stock Cars", { exact: true })).toBeVisible();
    await expect(page.getByText("Stock Value", { exact: true })).toBeVisible();
    await expect(page.getByText("Total Cars Bought")).toBeVisible();
    await expect(page.getByText("Cars Sold / Completed")).toBeVisible();
    await expect(page.getByText("Total Realized Recovery")).toBeVisible();
    await expect(page.getByText("Total Car Expenses")).toBeVisible();
    await expect(page.getByText("Total Business Expenses")).toBeVisible();
    await expect(page.getByText("Realized Car Profit", { exact: true })).toBeVisible();
    await expect(page.getByText("Net Business Profit", { exact: true })).toBeVisible();

    // 4.3 This Month panel
    await expect(page.getByText(/This Month:/i)).toBeVisible();
    await expect(page.getByText("1. Operations")).toBeVisible();
    await expect(page.getByText("2. Cash & Expenses")).toBeVisible();
    await expect(page.getByText("3. Financial Results")).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: "C:/Users/Rahat/.gemini/antigravity-ide/brain/e851f0d3-cd13-4e27-9b71-137879d93b4a/dashboard_full_view.png",
      fullPage: true,
    });
  });

  test("tests 4.4 Quick Actions: + Add Expense dialog opens and closes", async ({ page }) => {
    await page.goto("/dashboard");

    // Click + Add Expense
    await page.getByRole("button", { name: /\+ Add Expense/i }).click();

    // Dialog opens
    await expect(page.getByRole("heading", { name: "Record Expense" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Business Expense" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Car Expense" })).toBeVisible();

    // Switch to Car Expense
    await page.getByRole("button", { name: "Car Expense" }).click();
    await expect(page.getByText(/Select Vehicle/i)).toBeVisible();

    // Capture dialog screenshot
    await page.screenshot({
      path: "C:/Users/Rahat/.gemini/antigravity-ide/brain/e851f0d3-cd13-4e27-9b71-137879d93b4a/quick_expense_modal.png",
    });

    // Close dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Record Expense" })).not.toBeVisible();
  });

  test("tests 4.4 Quick Actions: + Sell / Recovery car selector opens and closes", async ({ page }) => {
    await page.goto("/dashboard");

    // Click + Sell / Recovery
    await page.getByRole("button", { name: /\+ Sell \/ Recovery/i }).click();

    // Dialog opens
    await expect(page.getByRole("heading", { name: "Sell / Recovery" })).toBeVisible();
    await expect(page.getByPlaceholder(/Search active stock/i)).toBeVisible();

    // Capture dialog screenshot
    await page.screenshot({
      path: "C:/Users/Rahat/.gemini/antigravity-ide/brain/e851f0d3-cd13-4e27-9b71-137879d93b4a/quick_sell_modal.png",
    });

    // Close dialog
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("heading", { name: "Sell / Recovery" })).not.toBeVisible();
  });

  test("tests 4.4 Quick Actions: + Buy Car navigates to /cars/new", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("link", { name: /\+ Buy Car/i }).click();
    await page.waitForURL(/\/cars\/new/);
    await expect(page).toHaveURL(/\/cars\/new/);
  });
});
