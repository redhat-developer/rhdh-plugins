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
import { performLogin } from '../fixtures/auth';
import { TIMEOUTS } from '../utils/constants';

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

  async login() {
    await performLogin(this.page);
  }

  /** @deprecated Use {@link login} */
  async loginAsGuest() {
    await performLogin(this.page);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async navigateToDataCenter() {
    await this.page.goto('/dcm', { timeout: TIMEOUTS.page });
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
    ).toBeVisible({ timeout: TIMEOUTS.table });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────

  async clickTab(tabName: DcmTab) {
    await this.page.getByRole('tab', { name: tabName }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyTabVisible(tabName: DcmTab) {
    await expect(this.page.getByRole('tab', { name: tabName })).toBeVisible({
      timeout: TIMEOUTS.element,
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
      timeout: TIMEOUTS.table,
    });
  }

  async verifyTableHasRows(minRows = 1) {
    const rows = this.page.locator('table').first().locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: TIMEOUTS.table });
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
    ).toBeVisible({ timeout: TIMEOUTS.element });
  }

  async verifyNoCellContent(text: string) {
    await expect(this.page.getByRole('cell', { name: text })).toHaveCount(0, {
      timeout: TIMEOUTS.element,
    });
  }

  // ── Search ────────────────────────────────────────────────────────────

  async searchFor(text: string) {
    const searchInput = this.page.getByRole('textbox', { name: 'Search' });
    await searchInput.click();
    await searchInput.fill(text);
  }

  async clearSearch() {
    const clearBtn = this.page.getByRole('button', { name: /clear/i });
    if (await clearBtn.first().isVisible().catch(() => false)) {
      await clearBtn.first().click();
    } else {
      const searchInput = this.page.getByRole('textbox', { name: 'Search' });
      await searchInput.fill('');
    }
  }

  // ── Empty & error states ──────────────────────────────────────────────

  async verifyEmptyState(titleText: string) {
    await expect(this.page.getByText(titleText)).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  }

  async verifyLoadError() {
    await expect(this.page.locator('[class*="MuiAlert"]').first()).toBeVisible({
      timeout: TIMEOUTS.element,
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
    ).toBeVisible({ timeout: TIMEOUTS.short });
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
    ).toBeVisible({ timeout: TIMEOUTS.short });
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
    ).toBeVisible({ timeout: TIMEOUTS.short });
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
    await this.page.waitForTimeout(TIMEOUTS.networkSettle);
  }

  // ── Instance CRUD ─────────────────────────────────────────────────────

  async clickCreateInstance() {
    await this.clickCreateButton();
    await expect(
      this.page.getByRole('heading', {
        name: 'Create catalog item instance',
      }),
    ).toBeVisible({ timeout: TIMEOUTS.short });
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
    const snackbar = this.page
      .locator('[class*="MuiAlert-standardSuccess"]')
      .first()
      .or(this.page.locator('[class*="MuiAlert-filledSuccess"]').first())
      .or(this.page.locator('[class*="MuiSnackbar"]').first())
      .or(this.page.locator('[role="alert"]').filter({ hasText: /success|created|registered|saved/i }).first());
    await expect(snackbar).toBeVisible({ timeout: TIMEOUTS.element });
  }

  // ── Shared dialog actions ─────────────────────────────────────────────

  async submitDialog(buttonLabel: string) {
    const btn = this.page
      .locator('[role="dialog"], [class*="MuiDrawer"]')
      .getByRole('button', { name: buttonLabel });
    await btn.click();
    await this.page.waitForLoadState('networkidle');
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
      timeout: TIMEOUTS.dialog,
    });
  }

  async waitForTableRefresh() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(TIMEOUTS.networkSettle);
  }

  async getRowsPerPageValue(): Promise<string> {
    const rppSelect = this.page
      .locator('[role="button"][aria-haspopup="listbox"]')
      .filter({ hasText: /rows|\d+/ });
    if (await rppSelect.first().isVisible().catch(() => false)) {
      return (await rppSelect.first().textContent()) ?? '';
    }
    const paginationSelect = this.page.locator('select').filter({ hasText: /\d+/ });
    return (await paginationSelect.first().inputValue().catch(() => '')) ?? '';
  }

  async setRowsPerPage(value: string) {
    const rppSelect = this.page
      .locator('[role="button"][aria-haspopup="listbox"]')
      .filter({ hasText: /rows|\d+/ });
    if (await rppSelect.first().isVisible().catch(() => false)) {
      await rppSelect.first().click();
      await this.page.getByRole('option', { name: value }).click();
    } else {
      const selectEl = this.page.locator('select').filter({ hasText: /\d+/ });
      await selectEl.first().selectOption(value);
    }
    await this.page.waitForTimeout(TIMEOUTS.networkSettle);
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
    const ariaField = this.page.getByLabel(label);
    if ((await ariaField.count()) > 0) {
      await ariaField.first().click();
      await ariaField.first().fill(value);
      return;
    }
    const cssField = this.page.locator(
      `label:has-text("${label}") + div input, label:has-text("${label}") + div textarea`,
    );
    await cssField.first().click();
    await cssField.first().fill(value);
  }

  private async selectOption(label: string, value: string) {
    const ariaCombo = this.page.getByLabel(label);
    if ((await ariaCombo.count()) > 0) {
      await ariaCombo.first().click();
    } else {
      const cssFallback = this.page
        .locator(`label:has-text("${label}")`)
        .locator('..')
        .locator('[role="button"], select');
      await cssFallback.first().click();
    }
    await this.page.getByRole('option', { name: value }).click();
  }

  private async selectMultipleOptions(label: string, values: string[]) {
    const ariaCombo = this.page.getByLabel(label);
    if ((await ariaCombo.count()) > 0) {
      await ariaCombo.first().click();
    } else {
      const cssFallback = this.page
        .locator(`label:has-text("${label}")`)
        .locator('..')
        .locator('[role="button"], select');
      await cssFallback.first().click();
    }
    for (const value of values) {
      await this.page.getByRole('option', { name: value }).click();
    }
    await this.page.keyboard.press('Escape');
  }
}
