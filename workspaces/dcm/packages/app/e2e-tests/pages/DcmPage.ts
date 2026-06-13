/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect, type Page } from '@playwright/test';
import { performGuestLogin } from '../fixtures/auth';

const DCM_TABS = [
  'Providers',
  'Policies',
  'Service types',
  'Catalog items',
  'Instances',
  'Resources',
] as const;

type DcmTab = (typeof DCM_TABS)[number];

const SERVICE_TYPES = [
  'cluster',
  'container',
  'database',
  'three-tier-app-demo',
  'vm',
] as const;

type ServiceType = (typeof SERVICE_TYPES)[number];

export { DCM_TABS, SERVICE_TYPES };
export type { DcmTab, ServiceType };

export class DcmPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async loginAsGuest() {
    await performGuestLogin(this.page);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async navigateToDataCenter() {
    await this.page.goto('/dcm', { timeout: 60000 });
    await this.page.waitForLoadState('networkidle');
  }

  async clickDataCenterNavBarItem() {
    await this.page
      .locator('[data-testid="sidebar-root"]')
      .getByRole('link', { name: 'Data Center' })
      .click();
    await this.verifyPageTitle();
  }

  async verifyPageTitle() {
    await expect(
      this.page.locator('h3').filter({ hasText: 'Data Center' }),
    ).toBeVisible({ timeout: 15000 });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────

  async clickTab(tabName: DcmTab) {
    await this.page.getByRole('tab', { name: tabName }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyTabVisible(tabName: DcmTab) {
    await expect(this.page.getByRole('tab', { name: tabName })).toBeVisible({
      timeout: 10000,
    });
  }

  async verifyAllTabsVisible() {
    for (const tab of DCM_TABS) {
      await this.verifyTabVisible(tab);
    }
  }

  async verifyTabSelected(tabName: DcmTab) {
    await expect(this.page.getByRole('tab', { name: tabName })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }

  // ── Table assertions ──────────────────────────────────────────────────

  async verifyTableVisible() {
    await expect(this.page.locator('table').first()).toBeVisible({
      timeout: 15000,
    });
  }

  async verifyTableHasRows(minRows = 1) {
    const rows = this.page.locator('table').first().locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(minRows);
  }

  async getTableRowCount(): Promise<number> {
    await this.verifyTableVisible();
    return this.page.locator('table').first().locator('tbody tr').count();
  }

  async verifyColumnHeader(headerText: string) {
    await expect(
      this.page.getByRole('columnheader', { name: headerText, exact: true }),
    ).toBeVisible();
  }

  async verifyCellContent(text: string) {
    await expect(
      this.page.getByRole('cell', { name: text }).first(),
    ).toBeVisible({ timeout: 10000 });
  }

  async verifyNoCellContent(text: string) {
    await expect(this.page.getByRole('cell', { name: text })).toHaveCount(0, {
      timeout: 10000,
    });
  }

  // ── Search ────────────────────────────────────────────────────────────

  async searchFor(text: string) {
    const searchInput = this.page.getByRole('textbox', { name: 'Search' });
    await searchInput.click();
    await searchInput.fill(text);
  }

  async clearSearch() {
    await this.page.getByRole('button', { name: 'Clear search' }).click();
  }

  // ── Empty & error states ──────────────────────────────────────────────

  async verifyEmptyState(titleText: string) {
    await expect(this.page.getByText(titleText)).toBeVisible({
      timeout: 10000,
    });
  }

  async verifyLoadError() {
    await expect(this.page.locator('[class*="MuiAlert"]').first()).toBeVisible({
      timeout: 10000,
    });
  }

  async clickRetry() {
    await this.page.getByRole('button', { name: 'Retry' }).click();
  }

  // ── Provider CRUD ─────────────────────────────────────────────────────

  async clickRegisterProvider() {
    await this.page.getByRole('button', { name: 'Register' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Register provider' }),
    ).toBeVisible({ timeout: 5000 });
  }

  async fillProviderForm(opts: {
    name: string;
    endpoint: string;
    serviceType: ServiceType;
    schemaVersion: string;
    operations?: string[];
  }) {
    await this.fillTextField('Name *', opts.name);
    await this.fillTextField('Endpoint *', opts.endpoint);
    await this.selectOption('Service type *', opts.serviceType);
    await this.fillTextField('Schema version *', opts.schemaVersion);
    if (opts.operations && opts.operations.length > 0) {
      await this.selectMultipleOptions('Operations', opts.operations);
    }
  }

  async clickEditOnRow(displayName: string) {
    const row = this.page.locator('table tbody tr', { hasText: displayName });
    await row.getByRole('button', { name: 'Edit' }).click();
  }

  async clickDeleteOnRow(displayName: string) {
    const row = this.page.locator('table tbody tr', { hasText: displayName });
    await row.getByRole('button', { name: 'Delete' }).click();
  }

  // ── Policy CRUD ───────────────────────────────────────────────────────

  async clickCreateButton() {
    await this.page
      .getByRole('button', { name: 'Create', exact: true })
      .click();
  }

  async clickCreatePolicy() {
    await this.clickCreateButton();
    await expect(
      this.page.getByRole('heading', { name: 'Create policy' }),
    ).toBeVisible({ timeout: 5000 });
  }

  async fillPolicyForm(opts: {
    displayName: string;
    description?: string;
    policyType: 'GLOBAL' | 'USER';
    priority?: string;
    regoCode: string;
    enabled?: boolean;
  }) {
    await this.fillTextField('Display name *', opts.displayName);
    if (opts.description) {
      await this.fillTextField('Description', opts.description);
    }
    const policyTypeLabel =
      opts.policyType === 'GLOBAL'
        ? 'GLOBAL — applies to all requests'
        : 'USER — applies per user';
    await this.selectOption('Policy type *', policyTypeLabel);
    if (opts.priority) {
      await this.fillTextField('Priority', opts.priority);
    }
    await this.fillTextField('Rego code *', opts.regoCode);
    if (opts.enabled === false) {
      const toggle = this.page.locator('input[type="checkbox"]');
      if (await toggle.isChecked()) {
        await toggle.click({ force: true });
      }
    }
  }

  async togglePolicyEnabled(displayName: string) {
    const row = this.page.locator('table tbody tr', { hasText: displayName });
    await row.locator('[class*="MuiSwitch"] input').click({ force: true });
  }

  // ── Catalog item CRUD (uses Drawer, not modal) ────────────────────────

  async clickCreateCatalogItem() {
    await this.clickCreateButton();
    await expect(
      this.page.getByRole('heading', { name: 'Create catalog item' }),
    ).toBeVisible({ timeout: 5000 });
  }

  async fillCatalogItemForm(opts: {
    displayName: string;
    apiVersion: string;
    serviceType?: ServiceType;
  }) {
    await this.fillTextField('Display name *', opts.displayName);
    await this.fillTextField('API version *', opts.apiVersion);
    if (opts.serviceType) {
      await this.selectOption('Service type', opts.serviceType);
    }
  }

  async addCatalogItemField(opts: {
    path: string;
    displayName?: string;
    defaultValue?: string;
    editable?: boolean;
  }) {
    await this.page.getByRole('button', { name: /add field/i }).click();
    const fieldSection = this.page.locator('[class*="fieldRow"]').last();
    await fieldSection.getByLabel('Path *').fill(opts.path);
    if (opts.displayName) {
      await fieldSection.getByLabel('Display name').fill(opts.displayName);
    }
    if (opts.defaultValue) {
      await fieldSection.getByLabel('Default value').fill(opts.defaultValue);
    }
  }

  async closeCatalogItemDrawer() {
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async importCatalogItemFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"][accept*=".yaml"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1500);
  }

  // ── Instance CRUD ─────────────────────────────────────────────────────

  async clickCreateInstance() {
    await this.clickCreateButton();
    await expect(
      this.page.getByRole('heading', {
        name: 'Create catalog item instance',
      }),
    ).toBeVisible({ timeout: 5000 });
  }

  async fillInstanceForm(opts: {
    displayName: string;
    catalogItem: string;
    apiVersion: string;
  }) {
    await this.fillTextField('Display name *', opts.displayName);
    await this.selectOption('Catalog item *', opts.catalogItem);
    await this.fillTextField('API version *', opts.apiVersion);
  }

  async clickRehydrateInstance(displayName: string) {
    const row = this.page.locator('table tbody tr', { hasText: displayName });
    await row.getByRole('button', { name: 'Rehydrate instance' }).click();
  }

  async clickDeleteInstance(displayName: string) {
    const row = this.page.locator('table tbody tr', { hasText: displayName });
    await row.getByRole('button', { name: 'Delete instance' }).click();
  }

  async verifySuccessSnackbar() {
    await expect(
      this.page.locator('[class*="MuiAlert-standardSuccess"]').first(),
    ).toBeVisible({ timeout: 10000 });
  }

  // ── Shared dialog actions ─────────────────────────────────────────────

  async submitDialog(buttonLabel: string) {
    await this.page
      .locator('[role="dialog"], [class*="MuiDrawer"]')
      .getByRole('button', { name: buttonLabel })
      .click();
  }

  async confirmDelete() {
    await this.page
      .locator('[role="dialog"]')
      .getByRole('button', { name: 'Delete' })
      .click();
  }

  async cancelDialog() {
    await this.page
      .locator('[role="dialog"], [class*="MuiDrawer"]')
      .getByRole('button', { name: 'Cancel' })
      .click();
  }

  async waitForDialogClosed() {
    await expect(this.page.locator('[role="dialog"]')).toHaveCount(0, {
      timeout: 10000,
    });
  }

  async waitForTableRefresh() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async getRowsPerPageValue(): Promise<string> {
    const rppSelect = this.page
      .locator('[role="button"][aria-haspopup="listbox"]')
      .filter({ hasText: /rows/ });
    return (await rppSelect.textContent()) ?? '';
  }

  async setRowsPerPage(value: string) {
    const rppSelect = this.page
      .locator('[role="button"][aria-haspopup="listbox"]')
      .filter({ hasText: /rows/ });
    await rppSelect.click();
    await this.page.getByRole('option', { name: value }).click();
    await this.page.waitForTimeout(1000);
  }

  async getTableRowTexts(): Promise<string[]> {
    const rows = this.page.locator('table').first().locator('tbody tr');
    return rows.allTextContents();
  }

  async getEmptyRowCount(): Promise<number> {
    const texts = await this.getTableRowTexts();
    return texts.filter(t => t.trim() === '').length;
  }

  // ── Low-level form helpers ────────────────────────────────────────────

  private async fillTextField(label: string, value: string) {
    const field = this.page.locator(
      `label:has-text("${label}") + div input, label:has-text("${label}") + div textarea`,
    );
    if ((await field.count()) > 0) {
      await field.first().click();
      await field.first().fill(value);
      return;
    }
    const altField = this.page.getByLabel(label);
    await altField.click();
    await altField.fill(value);
  }

  private async selectOption(label: string, value: string) {
    const select = this.page
      .locator(`label:has-text("${label}")`)
      .locator('..')
      .locator('[role="button"], select');
    await select.first().click();
    await this.page.getByRole('option', { name: value }).click();
  }

  private async selectMultipleOptions(label: string, values: string[]) {
    const select = this.page
      .locator(`label:has-text("${label}")`)
      .locator('..')
      .locator('[role="button"], select');
    await select.first().click();
    for (const value of values) {
      await this.page.getByRole('option', { name: value }).click();
    }
    await this.page.keyboard.press('Escape');
  }
}
