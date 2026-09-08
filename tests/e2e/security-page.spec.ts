import { expect, test } from "@playwright/test";

test.describe("Page 14 - Security, Users & Backup (/settings/security)", () => {
  test("loads /settings/security, displays Section 17 security overview cards and user list", async ({
    page,
  }) => {
    await page.goto("/settings/security");
    await expect(page).toHaveURL(/\/settings\/security/);

    // Header validation
    await expect(
      page.getByRole("heading", { name: "Security, Users & Backup", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Protect application access, user roles, private credentials, and database backups."),
    ).toBeVisible();

    // Summary KPI cards
    await expect(page.getByTestId("kpi-sec-users")).toBeVisible();
    await expect(page.getByTestId("kpi-sec-auth")).toBeVisible();
    await expect(page.getByTestId("kpi-sec-db")).toBeVisible();
    await expect(page.getByTestId("kpi-sec-sheets")).toBeVisible();

    // Section 17.2 Users Table
    await expect(page.getByTestId("users-table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "User" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Assigned Role" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Account Status" })).toBeVisible();

    // Section 17.2 Role Permission Matrix
    await expect(page.getByText("Section 17.2 Role Permission Matrix")).toBeVisible();
    await expect(page.getByText("Administrator", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Staff / Operator", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Viewer (Read-Only)", { exact: true }).first()).toBeVisible();

    // Section 17.1 & 17.3 Policies
    await expect(page.getByText("17.1 Authentication & Credential Security")).toBeVisible();
    await expect(page.getByText("17.3 Google Sheets Security Standards")).toBeVisible();

    // Section 17.4 Backup
    await expect(page.getByText("17.4 System Backup & Disaster Recovery")).toBeVisible();
    await expect(page.getByTestId("generate-backup-btn")).toBeVisible();
  });

  test("generates and downloads a full database backup snapshot", async ({ page }) => {
    await page.goto("/settings/security");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("generate-backup-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("car-scrap-backup-");
    expect(download.suggestedFilename()).toContain(".json");
  });

  test("opens edit role dialog and updates user access settings", async ({ page }) => {
    await page.goto("/settings/security");

    // Click first "Edit Role" button
    const editBtn = page.getByRole("button", { name: "Edit Role" }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Modal appears
    await expect(page.getByText(/Edit Role & Access/)).toBeVisible();

    // Select role
    await page.getByTestId("select-edit-role").selectOption("ADMIN");

    // Save
    await page.getByTestId("save-role-btn").click();

    // Modal closes
    await expect(page.getByText(/Edit Role & Access/)).not.toBeVisible();
  });

  test("navigates to /settings/security via sidebar navigation link", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile viewports");

    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Security & Backup" });
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(
      page.getByRole("heading", { name: "Security, Users & Backup", level: 1 }),
    ).toBeVisible();
  });
});
