import { expect, test } from "@playwright/test";

test.describe("Page 9 - Finance / Cash Flow (/finance)", () => {
  test("loads /finance, displays Section 12 KPI cards, filter toolbar, and ledger table", async ({
    page,
  }) => {
    await page.goto("/finance");
    await expect(page).toHaveURL(/\/finance/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Finance / Cash Flow", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Single ledger-based view of money entering and leaving the business."),
    ).toBeVisible();

    // Section 12.3 Summary KPI cards
    await expect(page.getByTestId("kpi-opening-cash")).toBeVisible();
    await expect(page.getByTestId("kpi-money-in")).toBeVisible();
    await expect(page.getByTestId("kpi-money-out")).toBeVisible();
    await expect(page.getByTestId("kpi-available-cash")).toBeVisible();

    // Core formula notice
    await expect(
      page.getByText("Opening + In - Out (Stock Excl.)"),
    ).toBeVisible();

    // Action buttons
    await expect(page.getByTestId("export-csv-btn")).toBeVisible();
    await expect(page.getByTestId("add-category-btn")).toBeVisible();
    await expect(page.getByTestId("record-transaction-btn")).toBeVisible();

    // Section 12.4 Ledger Table and columns
    await expect(page.getByTestId("finance-ledger-table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Reference" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Description / Reason" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Method" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Money In (AED)" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Money Out (AED)" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Running Balance" })).toBeVisible();
  });

  test("configures Opening Cash and recalculates Available Cash", async ({ page }) => {
    await page.goto("/finance");

    // Open opening cash modal via header button or card settings icon
    const configBtn = page.getByTestId("configure-opening-cash-trigger");
    await expect(configBtn).toBeVisible();
    await configBtn.click();

    await expect(page.getByRole("heading", { name: "Configure Opening Cash" })).toBeVisible();
    await expect(
      page.getByText("Available Cash = Opening Cash + Money In - Money Out"),
    ).toBeVisible();

    // Update opening amount to 50000
    const amountInput = page.getByLabel("Opening Balance (AED) *");
    await amountInput.fill("50000");

    await page.getByRole("button", { name: "Save Opening Cash" }).click();

    // Verify modal closes and Opening Cash card updates
    await expect(page.getByRole("heading", { name: "Configure Opening Cash" })).not.toBeVisible();
    await expect(page.getByText("AED 50,000.00")).toBeVisible();
  });

  test("creates a custom category and records a manual financial transaction", async ({
    page,
  }) => {
    await page.goto("/finance");

    const suffix = Date.now().toString().slice(-4);
    const customCategoryName = `Recycling Scrap ${suffix}`;

    // 1. Create a custom category
    await page.getByTestId("add-category-btn").click();
    await expect(page.getByRole("heading", { name: "Add Custom Category" })).toBeVisible();

    await page.getByLabel("Category Name *").fill(customCategoryName);
    await page.getByRole("button", { name: "Create Category" }).click();

    // Modal closes
    await expect(page.getByRole("heading", { name: "Add Custom Category" })).not.toBeVisible();

    // 2. Record a manual transaction with this category
    await page.getByTestId("record-transaction-btn").click();
    await expect(page.getByRole("heading", { name: "Record Financial Transaction" })).toBeVisible();

    // Choose category
    await page.locator("#tx-category").selectOption(customCategoryName);

    // Enter Amount
    await page.getByLabel("Amount (AED) *").fill("3500");

    // Enter mandatory description (Section 12.5)
    const testDesc = `Bulk scrap batch payout test ${suffix}`;
    await page.getByLabel("Description / Reason *").fill(testDesc);

    // Submit
    await page.getByRole("button", { name: "Record Transaction" }).click();

    // Modal closes
    await expect(page.getByRole("heading", { name: "Record Financial Transaction" })).not.toBeVisible();

    // Transaction should appear in the ledger table within its unique row
    const targetRow = page.locator("tr", { hasText: testDesc });
    await expect(targetRow).toBeVisible();
    await expect(targetRow.getByText(customCategoryName)).toBeVisible();
    await expect(targetRow.getByText("+AED 3,500.00")).toBeVisible();
  });

  test("exports ledger to CSV", async ({ page }) => {
    await page.goto("/finance");

    // Trigger CSV download
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-csv-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("finance-ledger-");
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("navigates to /finance via sidebar navigation Cash Flow link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");
    const cashFlowLink = page.getByRole("link", { name: "Cash Flow" });
    await expect(cashFlowLink).toBeVisible();
    await cashFlowLink.click();

    await expect(page).toHaveURL(/\/finance/);
    await expect(
      page.getByRole("heading", { name: "Finance / Cash Flow", level: 1 }),
    ).toBeVisible();
  });
});
