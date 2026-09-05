import { expect, test } from "@playwright/test";

test.describe("Page 7 - Sellers (/sellers)", () => {
  test("loads /sellers, displays KPI cards, search input, and opens Add Seller modal", async ({
    page,
  }) => {
    await page.goto("/sellers");

    // Page title and description
    await expect(
      page.getByRole("heading", { name: "Sellers", exact: true }),
    ).toBeVisible();

    // KPI Cards
    await expect(page.getByTestId("kpi-active-sellers")).toBeVisible();
    await expect(page.getByTestId("kpi-cars-purchased")).toBeVisible();
    await expect(page.getByTestId("kpi-total-spend")).toBeVisible();
    await expect(page.getByTestId("kpi-avg-cars")).toBeVisible();

    // Table
    await expect(page.getByTestId("sellers-table")).toBeVisible();

    // Open Add Seller Dialog
    const addBtn = page.getByRole("button", { name: /Add Seller/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(
      page.getByRole("heading", { name: /Add New Seller/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("creates a new seller, warns on duplicate phone, and views seller profile", async ({
    page,
  }) => {
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const sellerName = `Tariq Al-Mansoor ${uniqueSuffix}`;
    const sharedPhone = `+971 50 777 ${uniqueSuffix}`;

    await page.goto("/sellers");

    // 1. Add First Seller
    await page.getByRole("button", { name: /Add Seller/i }).click();
    await page.getByLabel(/Seller Name/i).fill(sellerName);
    await page.getByLabel(/Phone Number/i).fill(sharedPhone);
    await page.getByLabel(/Location \/ Area/i).fill("Al Qusais, Dubai");
    await page.getByRole("button", { name: "Add Seller", exact: true }).click();

    // Verify first seller appears
    await expect(page.getByText(/added successfully/i)).toBeVisible();
    const sellerLink = page.getByRole("link", { name: sellerName });
    await expect(sellerLink).toBeVisible({ timeout: 10000 });

    // 2. Try adding second seller with same phone to test Duplicate Phone Warning (Section 10.2)
    await page.getByRole("button", { name: /Add Seller/i }).click();
    await page.getByLabel(/Seller Name/i).fill(`Second Contact ${uniqueSuffix}`);
    const phoneInput = page.getByLabel(/Phone Number/i);
    await phoneInput.fill(sharedPhone);
    await phoneInput.blur();

    // Verify duplicate warning banner appears
    await expect(page.getByTestId("duplicate-phone-warning")).toBeVisible();
    await expect(page.getByText(/Duplicate Phone Warning/i)).toBeVisible();

    // Cancel modal
    await page.getByRole("button", { name: "Cancel" }).click();

    // 3. View first seller profile
    await sellerLink.click();
    await expect(page).toHaveURL(/\/sellers\/[0-9a-f-]+/);

    // Verify profile heading and summary cards
    await expect(
      page.getByRole("heading", { name: sellerName, exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("kpi-cars-sold")).toBeVisible();
    await expect(page.getByTestId("kpi-total-amount")).toBeVisible();
    await expect(page.getByTestId("kpi-last-deal")).toBeVisible();
    await expect(page.getByTestId("seller-linked-cars-table")).toBeVisible();

    // Back to sellers
    await page.getByRole("link", { name: "Back to Sellers" }).click();
    await expect(page).toHaveURL(/\/sellers/);
  });

  test("sidebar navigation links directly to /sellers", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Desktop sidebar is hidden on mobile viewports");
    await page.goto("/");
    const navLink = page.getByRole("link", { name: /Sellers/i });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/sellers/);
  });
});
