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
import { performGuestLogin, ensureAuthenticated } from '../fixtures/auth';

export class ResourceOptimizationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the Resource Optimization page.
   * Follows the flight-path pattern: goto root, login, then navigate.
   */
  async navigateToOptimization() {
    // Login first (goes to / and clicks Enter)
    await performGuestLogin(this.page);

    // Now navigate to the Resource Optimization page
    await this.page.goto('/redhat-resource-optimization', {
      waitUntil: 'domcontentloaded',
    });

    // Wait for the page to fully load
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the home page and click through sidebar to Resource Optimization
   */
  async navigateFromSidebar() {
    // Login first (goes to / and clicks Enter)
    await performGuestLogin(this.page);

    // Click on "Cost management" in the sidebar
    const costManagement = this.page.getByRole('button', {
      name: 'Cost management',
    });
    await expect(costManagement).toBeVisible({ timeout: 10000 });
    await costManagement.click();

    // Click on "Optimizations" submenu item
    const optimizations = this.page.getByRole('link', {
      name: 'Optimizations',
    });
    await expect(optimizations).toBeVisible({ timeout: 5000 });
    await optimizations.click();

    // Wait for the page to fully load
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await expect(this.page.getByText('Resource Optimization')).toBeVisible({
      timeout: 15000,
    });
  }

  /**
   * Wait for loading indicator to disappear
   */
  async waitForLoadingComplete() {
    // Wait for any loading indicators to disappear
    const loadingIndicator = this.page.getByTestId('loading-indicator');
    try {
      await expect(loadingIndicator).toHaveCount(0, { timeout: 30000 });
    } catch {
      // Loading indicator may not exist, which is fine
    }
  }

  /**
   * Open the filters sidebar (if needed)
   */
  async openFilters() {
    // Wait for the page to fully load first
    await this.waitForPageLoad();

    // Check if the filters button exists (for smaller screens)
    const filtersButton = this.page.getByRole('button', { name: 'Filters' });

    try {
      // Try to click the button if it exists and is visible
      await expect(filtersButton).toBeVisible({ timeout: 2000 });
      await filtersButton.click();
    } catch {
      // If the button is not visible, the filters are already open (larger screens)
      // This is normal behavior and not an error
    }
  }

  /**
   * Select a cluster from the dropdown
   */
  async selectCluster(clusterName: string) {
    // First open the filters sidebar (if needed)
    await this.openFilters();

    // Wait for filters to be visible
    await expect(this.page.getByText('Filters')).toBeVisible();

    // Find the CLUSTERS label and the associated textbox input
    const clustersLabel = this.page.getByText('CLUSTERS', { exact: true });
    await expect(clustersLabel).toBeVisible({ timeout: 10000 });

    const clustersContainer = this.page.locator('div', { has: clustersLabel });
    const clusterTextbox = clustersContainer
      .locator('input[type="text"]')
      .first();

    await expect(clusterTextbox).toBeVisible();
    await clusterTextbox.click();
    await clusterTextbox.fill(clusterName);

    // Select the option from dropdown
    const clusterOption = this.page.getByRole('option', {
      name: clusterName,
    });
    await expect(clusterOption).toBeVisible({ timeout: 5000 });
    await clusterOption.click();
  }

  /**
   * Get cluster filter textbox
   */
  getClusterFilterInput(): Locator {
    const clustersLabel = this.page.getByText('CLUSTERS', { exact: true });
    const clustersContainer = this.page.locator('div', { has: clustersLabel });
    return clustersContainer.locator('input[type="text"]').first();
  }

  /**
   * Wait for optimizations to load in the table
   */
  async viewOptimizations() {
    await this.waitForLoadingComplete();
    // The optimizations are displayed directly in the table
    // Verify the table with container column is visible
    const table = this.page.getByRole('table').filter({ hasText: 'Container' });
    await expect(table).toBeVisible({ timeout: 15000 });

    // Verify we can see table rows (not just headers)
    const tableRows = this.page.getByRole('row');
    await expect(tableRows.first()).toBeVisible();
  }

  /**
   * Get the count of optimizable containers displayed
   */
  async getOptimizableContainerCount(): Promise<number | null> {
    const containersText = this.page.getByText(
      /Optimizable containers \((\d+)\)/,
    );
    try {
      await expect(containersText).toBeVisible({ timeout: 15000 });
      const text = await containersText.textContent();
      const match = text?.match(/\((\d+)\)/);
      return match ? parseInt(match[1], 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Click on the first data row in the table
   */
  async clickFirstDataRow() {
    await this.viewOptimizations();

    // Get all table rows (excluding header)
    const tableRows = this.page.locator('table tbody tr');
    const firstRow = tableRows.first();

    await expect(firstRow).toBeVisible();

    // Click on the container link (first link in the row)
    const containerLink = firstRow.getByRole('link').first();
    await expect(containerLink).toBeVisible();
    await containerLink.click();

    // Wait for navigation to complete
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click on a specific row by index (0-based, not counting header)
   */
  async clickDataRowByIndex(index: number) {
    await this.viewOptimizations();

    // Get all data rows
    const tableRows = this.page.locator('table tbody tr');
    const targetRow = tableRows.nth(index);

    await expect(targetRow).toBeVisible();

    // Click on the container link
    const containerLink = targetRow.getByRole('link').first();
    await expect(containerLink).toBeVisible();
    await containerLink.click();

    // Wait for navigation
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Verify we're on the details page
   */
  async verifyDetailsPage() {
    // URL should contain /redhat-resource-optimization/rec-
    await expect(this.page).toHaveURL(
      /\/redhat-resource-optimization\/[a-f0-9]/,
      {
        timeout: 10000,
      },
    );

    // Details section should be visible
    await expect(this.page.getByText('Details')).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * Verify the tabs on the details page
   */
  async verifyDetailsTabs() {
    await expect(this.page.getByText('Cost optimizations')).toBeVisible();
    await expect(
      this.page.getByText('Performance optimizations'),
    ).toBeVisible();
  }

  /**
   * Verify configuration sections on details page
   */
  async verifyConfigurationSections() {
    await expect(this.page.getByText('Current configuration')).toBeVisible();
    await expect(
      this.page.getByText('Recommended configuration'),
    ).toBeVisible();

    // Verify configuration structure
    await expect(this.page.getByText('limits:').first()).toBeVisible();
    await expect(this.page.getByText('requests:').first()).toBeVisible();
    await expect(this.page.getByText('cpu:').first()).toBeVisible();
    await expect(this.page.getByText('memory:').first()).toBeVisible();
  }

  /**
   * Verify utilization charts are present
   */
  async verifyUtilizationCharts() {
    await expect(this.page.getByText('CPU utilization')).toBeVisible();
    await expect(this.page.getByText('Memory utilization')).toBeVisible();
  }

  /**
   * Click the "Apply recommendation" button
   */
  async clickApplyRecommendation() {
    const applyButton = this.page.getByRole('button', {
      name: 'Apply recommendation',
    });
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await applyButton.click();
  }

  /**
   * Verify the Apply recommendation button is present
   */
  async verifyApplyRecommendationButton() {
    const applyButton = this.page.getByRole('button', {
      name: 'Apply recommendation',
    });
    await expect(applyButton).toBeVisible();
  }

  /**
   * Wait for workflow execution result (after clicking Apply)
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
   * Apply a specific optimization recommendation (by test ID)
   */
  async applyRecommendation(optimizationId: string) {
    const applyButton = this.page.getByTestId(`apply-${optimizationId}`);
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await applyButton.click();
  }

  /**
   * Verify optimization recommendation is displayed in the table
   */
  async verifyOptimizationDisplayed(optimization: {
    workloadName: string;
    resourceType: string;
    currentValue: string;
    recommendedValue: string;
    savings: { cost: number };
  }) {
    // Check if the workload name appears in the table
    await expect(this.page.getByText(optimization.workloadName)).toBeVisible();
  }

  /**
   * Verify empty state is displayed
   */
  async expectEmptyState() {
    await expect(this.page.getByText('No records to display')).toBeVisible();
  }

  /**
   * Verify error state is displayed
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
   * Verify loading state
   */
  async expectLoadingState() {
    await expect(this.page.getByText(/loading/i)).toBeVisible();
  }

  /**
   * Click retry button
   */
  async retry() {
    const retryButton = this.page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await retryButton.click();
  }

  /**
   * Verify workflow execution success message
   */
  async expectWorkflowSuccess() {
    await expect(
      this.page.getByText(/optimization applied successfully/i),
    ).toBeVisible();
  }

  /**
   * Verify workflow execution error message
   */
  async expectWorkflowError() {
    await expect(
      this.page.getByText(/failed to apply optimization/i),
    ).toBeVisible();
  }

  /**
   * Check if optimization is visible in the table
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
   * Get optimization row by workload name
   */
  getOptimizationCard(workloadName: string) {
    return this.page.locator('tr').filter({ hasText: workloadName });
  }

  /**
   * Verify optimization row accessibility
   */
  async validateOptimizationCardAccessibility(workloadName: string) {
    const row = this.getOptimizationCard(workloadName);
    await expect(row).toBeVisible();

    // Check that the row contains the workload name
    await expect(row.getByText(workloadName)).toBeVisible();

    // Check that the row is properly structured as a table row
    await expect(row).toHaveAttribute('role', 'row');
  }

  /**
   * Get the number of rows in the table (excluding header)
   */
  async getTableRowCount(): Promise<number> {
    await this.viewOptimizations();
    const dataRows = this.page.locator('table tbody tr');
    return await dataRows.count();
  }

  /**
   * Verify table headers are present
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
   * Navigate back to the list from details page
   */
  async navigateBackToList() {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Check if viewing variables section is visible after applying recommendation
   */
  async verifyViewVariablesSection() {
    await expect(
      this.page.locator('span').filter({ hasText: 'View variables' }),
    ).toBeVisible({ timeout: 10000 });
  }
}
