import { expect, test } from "@playwright/test";

test.describe("Page 10 - Business Expenses (/expenses/business)", () => {
  test("loads /expenses/business, displays Section 13 KPI cards, filter toolbar, and expense table", async ({
    page,
  }) => {
    await page.goto("/expenses/business");
    await expect(page).toHaveURL(/\/expenses\/business/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Business Expenses", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Capture general overheads not attributable to one specific car (Section 13)."),
    ).toBeVisible();

    // Section 13.3 Summary KPI cards
    await expect(page.getByTestId("kpi-biz-month-total")).toBeVisible();
    await expect(page.getByTestId("kpi-biz-month-count")).toBeVisible();
    await expect(page.getByTestId("kpi-biz-top-category")).toBeVisible();

    // Primary Action Button
    await expect(page.getByTestId("add-business-expense-btn")).toBeVisible();

    // Table & Columns
    await expect(page.getByTestId("business-expenses-table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Description" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Amount (AED)" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Method" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Notes" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  });

  test("records a new business expense and verifies synchronization with Finance Cash Flow", async ({
    page,
  }) => {
    await page.goto("/expenses/business");

    const suffix = Date.now().toString().slice(-4);
    const testDesc = `Industrial electricity utility bill ${suffix}`;

    // 1. Open modal and add expense
    await page.getByTestId("add-business-expense-btn").click();
    await expect(
      page.getByRole("heading", { name: "Add Business Expense" }),
    ).toBeVisible();

    // Category
    await page.locator("#biz-exp-category").selectOption("Electricity");

    // Amount
    await page.getByLabel("Amount (AED) *").fill("2400");

    // Payment Method
    await page.locator("#biz-exp-method").selectOption("BANK_TRANSFER");

    // Description
    await page.getByLabel("Description / Reason *").fill(testDesc);

    // Notes
    await page.getByLabel("Notes (Optional)").fill("DEWA Bill August Ref 88392");

    // Submit
    await page.getByRole("button", { name: "Save Expense" }).click();

    // Modal closes
    await expect(
      page.getByRole("heading", { name: "Add Business Expense" }),
    ).not.toBeVisible();

    // Verify row in table
    const targetRow = page.locator("tr", { hasText: testDesc });
    await expect(targetRow).toBeVisible();
    await expect(targetRow.getByText("Electricity", { exact: true })).toBeVisible();
    await expect(targetRow.getByText("Fixed / Regular")).toBeVisible();
    await expect(targetRow.getByText("AED 2,400.00")).toBeVisible();
    await expect(targetRow.getByText("Bank Transfer")).toBeVisible();

    // 2. Verify Finance impact (Finance Cash Flow /finance)
    await page.goto("/finance");
    const financeRow = page.locator("tr", { hasText: testDesc });
    await expect(financeRow).toBeVisible();
    await expect(financeRow.getByText("Money Out")).toBeVisible();
    await expect(financeRow.getByText("-AED 2,400.00")).toBeVisible();
  });

  test("edits and voids a business expense", async ({ page }) => {
    await page.goto("/expenses/business");

    const suffix = Date.now().toString().slice(-4);
    const testDesc = `Office cleaning consumables ${suffix}`;

    // Create an expense first
    await page.getByTestId("add-business-expense-btn").click();
    await page.locator("#biz-exp-category").selectOption("Cleaning");
    await page.getByLabel("Amount (AED) *").fill("450");
    await page.getByLabel("Description / Reason *").fill(testDesc);
    await page.getByRole("button", { name: "Save Expense" }).click();

    const row = page.locator("tr", { hasText: testDesc });
    await expect(row).toBeVisible();

    // 1. Edit expense
    await row.getByRole("button", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Business Expense" }),
    ).toBeVisible();

    // Change amount to 550
    await page.getByLabel("Amount (AED) *").fill("550");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit Business Expense" }),
    ).not.toBeVisible();
    await expect(row.getByText("AED 550.00")).toBeVisible();

    // 2. Void expense
    await row.getByRole("button", { name: "Void" }).click();
    await expect(
      page.getByRole("heading", { name: "Void Business Expense" }),
    ).toBeVisible();

    await page.getByLabel("Reason for Voiding *").fill("Mistake in payment record");
    await page.getByRole("button", { name: "Confirm Void" }).click();

    await expect(
      page.getByRole("heading", { name: "Void Business Expense" }),
    ).not.toBeVisible();

    // Switch status filter to ALL to view voided row
    await page.getByTestId("biz-exp-status-filter").selectOption("ALL");

    // Verify row shows voided indicator
    await expect(row.getByText("Voided").first()).toBeVisible();
    await expect(row.getByText("Void Reason: Mistake in payment record")).toBeVisible();
  });

  test("navigates to /expenses/business via sidebar navigation link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Business Expenses" });
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/expenses\/business/);
    await expect(
      page.getByRole("heading", { name: "Business Expenses", level: 1 }),
    ).toBeVisible();
  });
});
