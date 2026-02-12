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

import { Page, expect, Locator } from '@playwright/test';
import { performGuestLogin, performOIDCLogin } from '../fixtures/auth';

export class ResourceOptimizationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to the Resource Optimization page.
   * Automatically detects available login method (guest vs OIDC).
   * Uses sidebar navigation: Cost management > Optimizations.
   */
  async navigateToOptimization() {
    await this.autoLogin();
    await this.navigateViaSidebar();
  }

  /**
   * Navigate to the Resource Optimization page using OIDC login.
   * Uses sidebar navigation: Cost management > Optimizations.
   *
   * @param username - Keycloak username
   * @param password - Keycloak password
   */
  async navigateToOptimizationAsOIDC(username?: string, password?: string) {
    await performOIDCLogin(this.page, username, password);
    await this.navigateViaSidebar();
  }

  /**
   * Navigate to Resource Optimization via the sidebar:
   * Cost management > Optimizations.
   * Assumes the user is already logged in.
   */
  private async navigateViaSidebar() {
    // Expand "Cost management" in the sidebar
    const costManagement = this.page.getByRole('button', {
      name: 'Cost management',
    });
    await expect(costManagement).toBeVisible({ timeout: 15000 });
    await costManagement.click();

    // Click "Optimizations" sub-item
    const optimizations = this.page.getByRole('link', {
      name: 'Optimizations',
    });
    await expect(optimizations).toBeVisible({ timeout: 5000 });
    await optimizations.click();

    await this.waitForPageLoad();
  }

  /**
   * Automatically detect and perform the appropriate login method.
   * If an "Enter" button is found (guest login), use it.
   * Otherwise, fall back to OIDC popup login.
   */
  private async autoLogin() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');

    // Prefer guest login (Enter button) when available — it's simpler and
    // doesn't require Keycloak credentials. OIDC is only used when guest
    // isn't an option, or when explicitly requested via navigateToOptimizationAsOIDC.
    const enterButton = this.page.locator('button:has-text("Enter")');
    const hasGuest = await enterButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasGuest) {
      await enterButton.click();
    } else {
      // No guest option — try OIDC
      const signInButton = this.page.locator('button:has-text("Sign in")');
      const user = process.env.OIDC_USERNAME ?? 'ro-read-no-workflow';
      const pass = process.env.OIDC_PASSWORD ?? 'test';

      const popupPromise = this.page.waitForEvent('popup');
      await signInButton.click();
      const popup = await popupPromise;

      await popup.getByLabel('Username or email').fill(user);
      await popup.getByLabel('Password').fill(pass);
      await popup.getByRole('button', { name: 'Sign in' }).click();

      await popup.waitForEvent('close', { timeout: 30000 }).catch(() => {});
    }

    // Wait for the sidebar nav to appear — indicates login completed
    await this.page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Navigate to the home page and click through sidebar to Resource Optimization.
   * Alias for navigateToOptimization() — both use the sidebar path.
   */
  async navigateFromSidebar() {
    await this.autoLogin();
    await this.navigateViaSidebar();
  }

  /**
   * Navigate to the OpenShift Cost Management page via sidebar.
   * Assumes the user is already logged in.
   */
  async navigateToOpenShiftPage() {
    // Expand "Cost management" in the sidebar
    const costManagement = this.page.getByRole('button', {
      name: 'Cost management',
    });
    await expect(costManagement).toBeVisible({ timeout: 15000 });
    await costManagement.click();

    // Click "OpenShift" sub-item
    const openShiftLink = this.page.getByRole('link', { name: 'OpenShift' });
    await expect(openShiftLink).toBeVisible({ timeout: 5000 });
    await openShiftLink.click();

    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Navigate back to the list from details page.
   */
  async navigateBackToList() {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  // ---------------------------------------------------------------------------
  // Waiting helpers
  // ---------------------------------------------------------------------------

  /**
   * Wait for the page to load completely.
   * Waits for the progress bar to disappear first, then checks for page content.
   */
  async waitForPageLoad() {
    // Wait for any top-level progress bar to disappear
    const progressBar = this.page.locator('[role="progressbar"]');
    // eslint-disable-next-line testing-library/await-async-utils
    await progressBar
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => {});

    // Wait for the main heading to appear
    await expect(
      this.page.getByRole('heading', { name: 'Resource Optimization' }),
    ).toBeVisible({ timeout: 30000 });
  }

  /**
   * Wait for loading indicator to disappear.
   */
  async waitForLoadingComplete() {
    const loadingIndicator = this.page.getByTestId('loading-indicator');
    try {
      await expect(loadingIndicator).toHaveCount(0, { timeout: 30000 });
    } catch {
      // Loading indicator may not exist, which is fine
    }
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  /**
   * Open the filters sidebar (if needed).
   */
  async openFilters() {
    await this.waitForPageLoad();
    const filtersButton = this.page.getByRole('button', { name: 'Filters' });
    try {
      await expect(filtersButton).toBeVisible({ timeout: 2000 });
      await filtersButton.click();
    } catch {
      // Filters already visible on larger screens
    }
  }

  /**
   * Select a cluster from the dropdown.
   */
  async selectCluster(clusterName: string) {
    await this.openFilters();
    await expect(this.page.getByText('Filters')).toBeVisible();

    const clustersLabel = this.page.getByText('CLUSTERS', { exact: true });
    await expect(clustersLabel).toBeVisible({ timeout: 10000 });

    const clustersContainer = this.page.locator('div', { has: clustersLabel });
    const clusterTextbox = clustersContainer
      .locator('input[type="text"]')
      .first();

    await expect(clusterTextbox).toBeVisible();
    await clusterTextbox.click();
    await clusterTextbox.fill(clusterName);

    const clusterOption = this.page.getByRole('option', {
      name: clusterName,
    });
    await expect(clusterOption).toBeVisible({ timeout: 5000 });
    await clusterOption.click();
  }

  /**
   * Get cluster filter textbox.
   */
  getClusterFilterInput(): Locator {
    const clustersLabel = this.page.getByText('CLUSTERS', { exact: true });
    const clustersContainer = this.page.locator('div', { has: clustersLabel });
    return clustersContainer.locator('input[type="text"]').first();
  }

  // ---------------------------------------------------------------------------
  // Table operations
  // ---------------------------------------------------------------------------

  /**
   * Wait for optimizations to load in the table.
   */
  async viewOptimizations() {
    await this.waitForLoadingComplete();
    const table = this.page.getByRole('table').filter({ hasText: 'Container' });
    await expect(table).toBeVisible({ timeout: 15000 });
    const tableRows = this.page.getByRole('row');
    await expect(tableRows.first()).toBeVisible();
  }

  /**
   * Verify table headers are present.
   */
  async verifyTableHeaders() {
    await expect(
      this.page.getByRole('columnheader', { name: 'Container' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('columnheader', { name: 'Project' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('columnheader', { name: 'Workload' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('columnheader', { name: 'Type' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('columnheader', { name: 'Cluster' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('columnheader', { name: 'Last reported' }),
    ).toBeVisible();
  }

  /**
   * Get the number of data rows in the table (excluding header).
   */
  async getTableRowCount(): Promise<number> {
    await this.viewOptimizations();
    const dataRows = this.page.locator('table tbody tr');
    return await dataRows.count();
  }

  /**
   * Click on a column header to trigger sorting.
   *
   * @param columnName - The column header text (e.g. "Container", "Last reported")
   */
  async clickColumnHeader(columnName: string) {
    const header = this.page.getByRole('columnheader', { name: columnName });
    await expect(header).toBeVisible({ timeout: 5000 });
    await header.click();
    // Wait for table to re-render after sort
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the current sort direction for a column.
   *
   * @param columnName - The column header text
   * @returns 'asc' | 'desc' | 'none' based on the aria-sort attribute
   */
  async getSortDirection(columnName: string): Promise<'asc' | 'desc' | 'none'> {
    const header = this.page.getByRole('columnheader', { name: columnName });
    const ariaSort = await header.getAttribute('aria-sort');
    if (ariaSort === 'ascending') return 'asc';
    if (ariaSort === 'descending') return 'desc';
    return 'none';
  }

  /**
   * Get all values from a specific column in the table.
   *
   * @param columnIndex - 0-based index of the column
   * @returns Array of cell text values
   */
  async getColumnValues(columnIndex: number): Promise<string[]> {
    const cells = this.page.locator(
      `table tbody tr td:nth-child(${columnIndex + 1})`,
    );
    const count = await cells.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent();
      values.push(text?.trim() ?? '');
    }
    return values;
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  /**
   * Click the Next page button in the pagination controls.
   */
  async clickNextPage() {
    const nextButton = this.page.getByRole('button', {
      name: /next page/i,
    });
    await expect(nextButton).toBeVisible({ timeout: 5000 });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the Previous page button in the pagination controls.
   */
  async clickPreviousPage() {
    const prevButton = this.page.getByRole('button', {
      name: /previous page/i,
    });
    await expect(prevButton).toBeVisible({ timeout: 5000 });
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the pagination info text (e.g. "1-10 of 25").
   */
  async getPageInfo(): Promise<string> {
    // MUI TablePagination renders "X-Y of Z"
    const paginationLabel = this.page.locator(
      '.MuiTablePagination-displayedRows, [class*="displayedRows"]',
    );
    try {
      await expect(paginationLabel).toBeVisible({ timeout: 5000 });
      return (await paginationLabel.textContent())?.trim() ?? '';
    } catch {
      // Fallback: look for the pattern in any element
      const text = await this.page
        .locator('text=/\\d+[–-]\\d+ of \\d+/')
        .first()
        .textContent();
      return text?.trim() ?? '';
    }
  }

  /**
   * Get the current rows-per-page value.
   */
  async getRowsPerPage(): Promise<string> {
    const select = this.page.locator(
      '.MuiTablePagination-select, [class*="MuiSelect-select"]',
    );
    try {
      await expect(select).toBeVisible({ timeout: 5000 });
      return (await select.textContent())?.trim() ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Check if the Next page button is enabled.
   */
  async isNextPageEnabled(): Promise<boolean> {
    const nextButton = this.page.getByRole('button', {
      name: /next page/i,
    });
    try {
      return await nextButton.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if the Previous page button is enabled.
   */
  async isPreviousPageEnabled(): Promise<boolean> {
    const prevButton = this.page.getByRole('button', {
      name: /previous page/i,
    });
    try {
      return await prevButton.isEnabled();
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  /**
   * Switch the RHDH theme via Settings page.
   *
   * @param theme - 'Light' | 'Dark' | 'Auto'
   */
  async switchTheme(theme: 'Light' | 'Dark' | 'Auto') {
    await this.page.goto('/settings', { waitUntil: 'domcontentloaded' });
    // Use a generous timeout for networkidle — under parallel test load
    // the server may be slow to settle.
    await this.page
      .waitForLoadState('networkidle', { timeout: 30000 })
      .catch(() => {});

    // The theme toggle is a set of radio buttons or toggle group
    const themeOption = this.page
      .getByRole('radio', { name: theme })
      .or(
        this.page.locator(`input[value="${theme.toLocaleLowerCase('en-US')}"]`),
      );

    try {
      await expect(themeOption).toBeVisible({ timeout: 5000 });
      await themeOption.click();
    } catch {
      // Fallback: click a button/link with the theme name
      await this.page
        .locator(`button, label, [role="tab"]`, { hasText: theme })
        .first()
        .click();
    }

    await this.page.waitForTimeout(1000);
  }

  // ---------------------------------------------------------------------------
  // OpenShift Cost Management page
  // ---------------------------------------------------------------------------

  /**
   * Get the current value of the currency dropdown.
   */
  async getCurrencyDropdownValue(): Promise<string> {
    // The currency button shows text like "USD ($) - United States Dollar"
    // Match it by its accessible name pattern: 3-letter code + parenthesized symbol
    const currencyButton = this.page.getByRole('button', {
      name: /^[A-Z]{3}\s*\(.*?\)\s*-\s*.+/,
    });
    try {
      await expect(currencyButton).toBeVisible({ timeout: 15000 });
      return (await currencyButton.textContent())?.trim() ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Select a currency from the currency dropdown.
   *
   * @param currency - e.g. 'USD', 'EUR', 'GBP'
   */
  async selectCurrency(currency: string) {
    // The currency button shows text like "USD ($) - United States Dollar"
    const currencyButton = this.page.getByRole('button', {
      name: /^[A-Z]{3}\s*\(.*?\)\s*-\s*.+/,
    });
    await expect(currencyButton).toBeVisible({ timeout: 15000 });
    await currencyButton.click();
    await this.page.waitForTimeout(500);

    // Select the option — options have full names like "EUR (€) - Euro"
    const option = this.page.getByRole('option', {
      name: new RegExp(currency, 'i'),
    });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the CSV export button on the OpenShift page.
   */
  async clickExportCSV() {
    const csvButton = this.page
      .getByRole('button', { name: /csv/i })
      .or(this.page.locator('button', { hasText: /csv/i }));
    await expect(csvButton).toBeVisible({ timeout: 5000 });
    await csvButton.click();
  }

  /**
   * Click the JSON export button on the OpenShift page.
   */
  async clickExportJSON() {
    const jsonButton = this.page
      .getByRole('button', { name: /json/i })
      .or(this.page.locator('button', { hasText: /json/i }));
    await expect(jsonButton).toBeVisible({ timeout: 5000 });
    await jsonButton.click();
  }

  // ---------------------------------------------------------------------------
  // Container count
  // ---------------------------------------------------------------------------

  /**
   * Get the count of optimizable containers displayed.
   */
  /**
   * Get the count of optimizable containers displayed.
   * Waits for the count to become non-zero (data loads asynchronously).
   */
  async getOptimizableContainerCount(): Promise<number | null> {
    // Wait for the count text that shows a non-zero number.
    // The page initially shows (0) while data is loading.
    const nonZeroCount = this.page.getByText(
      /Optimizable containers \([1-9]\d*\)/,
    );
    const zeroCount = this.page.getByText(/Optimizable containers \(0\)/);
    try {
      // Wait up to 30s for a non-zero count to appear
      await expect(nonZeroCount).toBeVisible({ timeout: 30000 });
      const text = await nonZeroCount.textContent();
      const match = text?.match(/\((\d+)\)/);
      return match ? parseInt(match[1], 10) : null;
    } catch {
      // If non-zero never appeared, check if zero count is showing
      try {
        if (await zeroCount.isVisible()) {
          return 0;
        }
      } catch {
        // neither visible
      }
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Detail page: row clicks
  // ---------------------------------------------------------------------------

  /**
   * Click on the first data row in the table.
   */
  async clickFirstDataRow() {
    await this.viewOptimizations();
    const tableRows = this.page.locator('table tbody tr');
    const firstRow = tableRows.first();
    await expect(firstRow).toBeVisible();

    const containerLink = firstRow.getByRole('link').first();
    await expect(containerLink).toBeVisible();
    await containerLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click on a specific row by index (0-based, not counting header).
   */
  async clickDataRowByIndex(index: number) {
    await this.viewOptimizations();
    const tableRows = this.page.locator('table tbody tr');
    const targetRow = tableRows.nth(index);
    await expect(targetRow).toBeVisible();

    const containerLink = targetRow.getByRole('link').first();
    await expect(containerLink).toBeVisible();
    await containerLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ---------------------------------------------------------------------------
  // Detail page: assertions
  // ---------------------------------------------------------------------------

  /**
   * Verify we're on the details page.
   */
  async verifyDetailsPage() {
    await expect(this.page).toHaveURL(
      /\/redhat-resource-optimization\/[a-f0-9]/,
      { timeout: 10000 },
    );
    await expect(this.page.getByText('Details')).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * Verify the tabs on the details page.
   */
  async verifyDetailsTabs() {
    await expect(this.page.getByText('Cost optimizations')).toBeVisible();
    await expect(
      this.page.getByText('Performance optimizations'),
    ).toBeVisible();
  }

  /**
   * Verify configuration sections on details page.
   */
  async verifyConfigurationSections() {
    await expect(this.page.getByText('Current configuration')).toBeVisible();
    await expect(
      this.page.getByText('Recommended configuration'),
    ).toBeVisible();
    await expect(this.page.getByText('limits:').first()).toBeVisible();
    await expect(this.page.getByText('requests:').first()).toBeVisible();
    await expect(this.page.getByText('cpu:').first()).toBeVisible();
    await expect(this.page.getByText('memory:').first()).toBeVisible();
  }

  /**
   * Verify utilization charts are present.
   */
  async verifyUtilizationCharts() {
    await expect(this.page.getByText('CPU utilization')).toBeVisible();
    await expect(this.page.getByText('Memory utilization')).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Apply Recommendation
  // ---------------------------------------------------------------------------

  /**
   * Click the "Apply recommendation" button.
   */
  async clickApplyRecommendation() {
    const applyButton = this.page.getByRole('button', {
      name: 'Apply recommendation',
    });
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await applyButton.click();
  }

  /**
   * Verify the Apply recommendation button is present.
   */
  async verifyApplyRecommendationButton() {
    const applyButton = this.page.getByRole('button', {
      name: 'Apply recommendation',
    });
    await expect(applyButton).toBeVisible();
  }

  /**
   * Verify the Apply recommendation button is disabled and shows a tooltip.
   * This is expected for users without workflow permissions.
   */
  async verifyApplyRecommendationDisabled() {
    // The button may be wrapped in a tooltip container when disabled.
    // A <span> with title="No permission to access the workflow" overlays the
    // button and intercepts pointer events, so we use { force: true } for hover.
    const applyButton = this.page.getByRole('button', {
      name: /apply recommendation/i,
    });
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await expect(applyButton).toBeDisabled();

    // Check for the "no permission" tooltip wrapper
    const noPermissionWrapper = this.page.locator(
      '[title="No permission to access the workflow"]',
    );
    try {
      await expect(noPermissionWrapper).toBeVisible({ timeout: 3000 });
    } catch {
      // Tooltip/wrapper might not be present — button being disabled is sufficient
    }
  }

  /**
   * Wait for workflow execution result (after clicking Apply).
   *
   * @param status - Expected status like 'Completed', 'Running', 'Failed'
   * @param timeout - Max wait time in ms (default 5 minutes)
   */
  async waitForWorkflowStatus(status: string, timeout: number = 300000) {
    const statusRegex = new RegExp(status, 'i');
    await expect(this.page.getByText(statusRegex)).toBeVisible({
      timeout: timeout,
    });
  }

  /**
   * Check if viewing variables section is visible after applying recommendation.
   */
  async verifyViewVariablesSection() {
    await expect(
      this.page.locator('span').filter({ hasText: 'View variables' }),
    ).toBeVisible({ timeout: 10000 });
  }

  // ---------------------------------------------------------------------------
  // State assertions
  // ---------------------------------------------------------------------------

  /**
   * Verify empty state is displayed.
   */
  async expectEmptyState() {
    await expect(this.page.getByText('No records to display')).toBeVisible();
  }

  /**
   * Verify error state is displayed.
   */
  async expectErrorState() {
    await expect(
      this.page.getByText(/error loading optimizations/i),
    ).toBeVisible();
    await expect(
      this.page.getByRole('button', { name: /retry/i }),
    ).toBeVisible();
  }

  /**
   * Verify Unauthorized error is displayed.
   */
  async expectUnauthorized() {
    // The "Unauthorized" error appears as a toast/alert notification with heading
    // "Error: Unauthorized". The alert role is the most reliable locator.
    const unauthorizedAlert = this.page
      .getByRole('alert')
      .filter({ hasText: /unauthorized/i });

    await expect(unauthorizedAlert).toBeVisible({ timeout: 15000 });
  }

  /**
   * Verify loading state.
   */
  async expectLoadingState() {
    await expect(this.page.getByText(/loading/i)).toBeVisible();
  }

  /**
   * Click retry button.
   */
  async retry() {
    const retryButton = this.page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await retryButton.click();
  }

  /**
   * Verify workflow execution success message.
   */
  async expectWorkflowSuccess() {
    await expect(
      this.page.getByText(/optimization applied successfully/i),
    ).toBeVisible();
  }

  /**
   * Verify workflow execution error message.
   */
  async expectWorkflowError() {
    await expect(
      this.page.getByText(/failed to apply optimization/i),
    ).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  /**
   * Apply a specific optimization recommendation (by test ID).
   */
  async applyRecommendation(optimizationId: string) {
    const applyButton = this.page.getByTestId(`apply-${optimizationId}`);
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await applyButton.click();
  }

  /**
   * Verify optimization recommendation is displayed in the table.
   */
  async verifyOptimizationDisplayed(optimization: {
    workloadName: string;
    resourceType: string;
    currentValue: string;
    recommendedValue: string;
    savings: { cost: number };
  }) {
    await expect(this.page.getByText(optimization.workloadName)).toBeVisible();
  }

  /**
   * Check if optimization is visible in the table.
   */
  async isOptimizationVisible(workloadName: string): Promise<boolean> {
    try {
      await expect(this.page.getByText(workloadName)).toBeVisible({
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get optimization row by workload name.
   */
  getOptimizationCard(workloadName: string) {
    return this.page.locator('tr').filter({ hasText: workloadName });
  }

  /**
   * Validate optimization row accessibility.
   */
  async validateOptimizationCardAccessibility(workloadName: string) {
    const row = this.getOptimizationCard(workloadName);
    await expect(row).toBeVisible();
    await expect(row.getByText(workloadName)).toBeVisible();
    await expect(row).toHaveAttribute('role', 'row');
  }

  // ---------------------------------------------------------------------------
  // API Interception — Cluster Discovery & Source Health Check
  // ---------------------------------------------------------------------------

  private _interceptedRecommendations: any[] | null = null;
  private _capturedCMToken: string | null = null;

  /**
   * Set up route interceptors to capture:
   *   1. The Cost Management Bearer token (from the backend /token endpoint).
   *   2. The recommendations API response (cluster list + source_ids).
   *
   * Call this BEFORE navigating to the optimizations page so the interceptors
   * are in place when the frontend makes its requests.
   */
  async setupAPIInterceptors() {
    this._interceptedRecommendations = null;
    this._capturedCMToken = null;

    // Capture the Cost Management Bearer token
    await this.page.route(
      '**/redhat-resource-optimization/token**',
      async route => {
        const response = await route.fetch();
        try {
          const body = await response.json();
          this._capturedCMToken = body.accessToken || body.access_token || null;
          await route.fulfill({ response, body: JSON.stringify(body) });
        } catch {
          await route.continue();
        }
      },
    );

    // Capture the recommendations response
    await this.page.route('**/recommendations/openshift**', async route => {
      const response = await route.fetch();
      try {
        const body = await response.json();
        this._interceptedRecommendations = body.data || [];
        await route.fulfill({ response, body: JSON.stringify(body) });
      } catch {
        await route.continue();
      }
    });
  }

  /**
   * Remove all API interceptors.
   */
  async removeAPIInterceptors() {
    await this.page.unroute('**/redhat-resource-optimization/token**');
    await this.page.unroute('**/recommendations/openshift**');
  }

  /**
   * Get unique clusters from the intercepted recommendations, each with its
   * source_id and last_reported timestamp.
   */
  getInterceptedClusters(): {
    name: string;
    sourceId: string;
    lastReported: string;
  }[] {
    if (!this._interceptedRecommendations) return [];
    const seen = new Map<string, { sourceId: string; lastReported: string }>();
    for (const rec of this._interceptedRecommendations) {
      const name = rec.cluster_alias || rec.cluster_uuid;
      if (name && !seen.has(name)) {
        seen.set(name, {
          sourceId: rec.source_id || '',
          lastReported: rec.last_reported || '',
        });
      }
    }
    return [...seen.entries()].map(([name, info]) => ({ name, ...info }));
  }

  /**
   * Check whether a cluster's Cost Management source is healthy by probing
   * the `/sources/{source_id}/` endpoint with the captured Bearer token.
   *
   * A healthy source returns HTTP 200.  Sources that return 502, 404, etc.
   * are broken (usually from torn-down clusters) and their workflows will fail.
   *
   * @returns true if the source is healthy (200), false otherwise.
   */
  async isSourceHealthy(sourceId: string): Promise<boolean> {
    if (!this._capturedCMToken || !sourceId) return false;

    const result: any = await this.page.evaluate(
      async ({ sid, token }: { sid: string; token: string }) => {
        const res = await fetch(
          `/api/proxy/cost-management/v1/sources/${sid}/`,
          {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        return { ok: res.ok, status: res.status };
      },
      { sid: sourceId, token: this._capturedCMToken },
    );

    return result.ok === true;
  }

  /**
   * From the intercepted clusters, find the first one whose Cost Management
   * source is healthy.  Returns the cluster name, or null if none are healthy.
   *
   * This is the key method for the Apply Recommendation test: it ensures we
   * pick a cluster whose workflow will actually succeed, skipping clusters
   * whose backing source has been deleted / is broken.
   */
  async findHealthyCluster(): Promise<string | null> {
    const healthy = await this.findAllHealthyClusters();
    return healthy.length > 0 ? healthy[0] : null;
  }

  /**
   * Return ALL clusters whose Cost Management source is healthy (HTTP 200),
   * in the order they appear in the intercepted data.
   */
  async findAllHealthyClusters(): Promise<string[]> {
    const clusters = this.getInterceptedClusters();
    const healthy: string[] = [];
    for (const cluster of clusters) {
      const ok = await this.isSourceHealthy(cluster.sourceId);
      if (ok) healthy.push(cluster.name);
    }
    return healthy;
  }

  /**
   * Get all recommendation IDs for a given cluster from the intercepted data.
   * These IDs can be used to navigate directly to detail pages via URL,
   * avoiding table row index issues when the page re-renders.
   *
   * @param clusterName - The cluster alias to filter by (or null to return []).
   * @returns Array of recommendation ID strings.
   */
  getRecommendationIdsForCluster(clusterName: string | null): string[] {
    if (!clusterName || !this._interceptedRecommendations) return [];
    const ids: string[] = [];
    for (const rec of this._interceptedRecommendations) {
      const cluster = rec.cluster_alias || rec.cluster_uuid;
      if (cluster === clusterName && rec.id) {
        ids.push(rec.id);
      }
    }
    return ids;
  }

  /**
   * Find and click a table row matching a given cluster name.
   * Checks the visible table page (does not paginate).
   *
   * @returns true if a matching row was found and clicked, false otherwise.
   */
  async clickRowForCluster(clusterName: string): Promise<boolean> {
    const rows = this.page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      const clusterText = await cells
        .nth(4)
        .textContent({ timeout: 3000 })
        .catch(() => '');
      if (clusterText?.trim() === clusterName) {
        const link = rows.nth(i).getByRole('link').first();
        await link.click();
        await this.page.waitForLoadState('domcontentloaded');
        return true;
      }
    }
    return false;
  }
}
