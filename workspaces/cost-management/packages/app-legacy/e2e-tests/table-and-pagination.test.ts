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

import { test, expect } from '@playwright/test';
import { ResourceOptimizationPage } from './pages/ResourceOptimizationPage';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Table structure, sorting, and pagination tests.
 * Covers: FLPATH-3118 (consistent table order), FLPATH-3121 (table columns),
 * FLPATH-3124 (sorting), FLPATH-3127 (pagination next/prev),
 * FLPATH-3128 (pagination info display).
 */
test.describe('Resource Optimization - Table & Pagination @live @ro', () => {
  let rosPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    rosPage = new ResourceOptimizationPage(page);
    await rosPage.navigateToOptimization();
  });

  // -------------------------------------------------------------------------
  // FLPATH-3121: Table columns and structure
  // -------------------------------------------------------------------------

  test.describe('Table Structure (FLPATH-3121)', () => {
    test('should display all expected column headers', async () => {
      await rosPage.verifyTableHeaders();
    });

    test('should display data rows in the table', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      const rowCount = await rosPage.getTableRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should display up to 10 rows per page by default', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      const rowCount = await rosPage.getTableRowCount();
      expect(rowCount).toBeLessThanOrEqual(10);
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3124: Sorting
  // -------------------------------------------------------------------------

  test.describe('Column Sorting (FLPATH-3124)', () => {
    test('should sort by Container column when header is clicked', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      // Get initial values from the first column (Container)
      const initialValues = await rosPage.getColumnValues(0);

      // Click Container header to sort
      await rosPage.clickColumnHeader('Container');
      const afterFirstClick = await rosPage.getColumnValues(0);

      // The values should be in some sorted order (asc or desc)
      // Verify they are actually sorted alphabetically in one direction
      const ascSorted = [...afterFirstClick].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      );
      const descSorted = [...ascSorted].reverse();

      const isAsc =
        JSON.stringify(afterFirstClick) === JSON.stringify(ascSorted);
      const isDesc =
        JSON.stringify(afterFirstClick) === JSON.stringify(descSorted);
      expect(isAsc || isDesc).toBe(true);
    });

    test('should toggle sort direction on repeated clicks', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      // Click once — sort ascending
      await rosPage.clickColumnHeader('Container');
      const firstClickContainers = await rosPage.getColumnValues(0);

      // Verify it's sorted alphabetically (ascending)
      const ascSorted = [...firstClickContainers].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      );
      expect(firstClickContainers).toEqual(ascSorted);

      // Click again — sort descending
      await rosPage.clickColumnHeader('Container');
      const secondClickContainers = await rosPage.getColumnValues(0);

      // Verify it's sorted reverse-alphabetically (descending)
      const descSorted = [...secondClickContainers].sort((a, b) =>
        b.localeCompare(a, undefined, { sensitivity: 'base' }),
      );
      expect(secondClickContainers).toEqual(descSorted);
    });

    test('should sort by Last reported column', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      const beforeSort = await rosPage.getColumnValues(5);
      await rosPage.clickColumnHeader('Last reported');
      const afterSort = await rosPage.getColumnValues(5);

      // Clicking should change the order (or at least be a valid sort)
      // The values should differ from the original unsorted order
      const changed = JSON.stringify(beforeSort) !== JSON.stringify(afterSort);
      expect(changed).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3127 & FLPATH-3128: Pagination
  // -------------------------------------------------------------------------

  test.describe('Pagination (FLPATH-3127, FLPATH-3128)', () => {
    test('should display pagination info', async ({ page }) => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      const pageInfo = await rosPage.getPageInfo();
      // Should match pattern like "1-10 of 25" or "1–10 of 25"
      expect(pageInfo).toMatch(/\d+[–-]\d+ of \d+/);
    });

    test('should have Previous page disabled on first page', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      const prevEnabled = await rosPage.isPreviousPageEnabled();
      expect(prevEnabled).toBe(false);
    });

    test('should have Next page enabled when there are more pages', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count < 11, 'Not enough data for multiple pages');

      const nextEnabled = await rosPage.isNextPageEnabled();
      expect(nextEnabled).toBe(true);
    });

    test('should navigate to next page and update pagination info', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count < 11, 'Not enough data for multiple pages');

      const firstPageInfo = await rosPage.getPageInfo();
      await rosPage.clickNextPage();
      const secondPageInfo = await rosPage.getPageInfo();

      // Page info should have changed
      expect(secondPageInfo).not.toEqual(firstPageInfo);
    });

    test('should navigate back to previous page', async () => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count < 11, 'Not enough data for multiple pages');

      const firstPageInfo = await rosPage.getPageInfo();
      await rosPage.clickNextPage();
      await rosPage.clickPreviousPage();
      const backPageInfo = await rosPage.getPageInfo();

      // Should be back to the first page
      expect(backPageInfo).toEqual(firstPageInfo);
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3118: Consistent table order across reload
  // -------------------------------------------------------------------------

  test.describe('Consistent Order (FLPATH-3118)', () => {
    test('should maintain the same row order after page reload', async ({
      page,
    }) => {
      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      // Get container names from first column
      const initialOrder = await rosPage.getColumnValues(0);

      // Reload the page
      await page.reload();
      await rosPage.waitForPageLoad();
      await rosPage.viewOptimizations();

      // Get container names again
      const afterReloadOrder = await rosPage.getColumnValues(0);

      expect(afterReloadOrder).toEqual(initialOrder);
    });
  });
});
