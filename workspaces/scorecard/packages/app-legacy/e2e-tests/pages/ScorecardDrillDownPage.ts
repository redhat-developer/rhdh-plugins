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

import { Locator, Page, expect } from '@playwright/test';
import {
  ScorecardMessages,
  getDrillDownCardSnapshot,
  getDrillDownMissingPermissionSnapshot,
  getDrillDownNoDataFoundSnapshot,
  getEntitiesPageMissingPermission,
  getEntitiesPageNoDataFound,
  getEntitiesTableHeaderLabels,
} from '../utils/translationUtils';

type MetricId = 'github.open_prs' | 'jira.open_issues';

export type DrillDownCardLocatorOptions = {
  aggregationId?: string;
  cardTitle?: string;
  cardDescription?: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ScorecardDrillDownPage {
  readonly page: Page;
  readonly translations: ScorecardMessages;

  constructor(page: Page, translations: ScorecardMessages) {
    this.page = page;
    this.translations = translations;
  }

  async expectOnPage(metricId: MetricId, options?: { aggregationId?: string }) {
    const parsedMetricId = escapeRegex(metricId);
    if (options?.aggregationId) {
      const parsedAggregationId = escapeRegex(options.aggregationId);
      await expect(this.page).toHaveURL(
        new RegExp(
          `/scorecard/aggregations/${parsedAggregationId}/metrics/${parsedMetricId}`,
        ),
      );
    } else {
      await expect(this.page).toHaveURL(
        new RegExp(
          `/scorecard/aggregations/${parsedMetricId}/metrics/${parsedMetricId}|/scorecard/metrics/${parsedMetricId}`,
        ),
      );
    }
  }

  async expectPageTitle(metricId: MetricId, customTitle?: string) {
    await expect(
      this.page.getByRole('heading', {
        name: customTitle ?? this.translations.metric[metricId].title,
        level: 1,
      }),
    ).toBeVisible();
  }

  getDrillDownCard(
    metricId: MetricId,
    options?: DrillDownCardLocatorOptions,
  ): Locator {
    const scorecardId = options?.aggregationId ?? metricId;
    return this.page.getByTestId(`scorecard-homepage-card-${scorecardId}`);
  }

  getEntitiesTable(): Locator {
    return this.page.getByRole('table');
  }

  getTableFooter(): Locator {
    return this.page.locator('tfoot');
  }

  async clickNextPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'next page' }).click();
  }

  async clickPreviousPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'previous page' }).click();
  }

  async expectTableFooterSnapshot(snapshot: string): Promise<void> {
    await expect(this.getTableFooter()).toMatchAriaSnapshot(snapshot);
  }

  /** Opens the rows-per-page dropdown; pass translated label (e.g. "5 rows", "5 lignes") when testing in non-English locale. */
  async openRowsPerPageDropdown(selectedRowsLabel?: string): Promise<void> {
    const name = selectedRowsLabel ?? 'rows';
    await this.page.getByRole('combobox', { name }).click();
  }

  async expectRowsPerPageListboxSnapshot(snapshot: string): Promise<void> {
    await expect(this.page.getByRole('listbox')).toMatchAriaSnapshot(snapshot);
  }

  async closeRowsPerPageDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async expectDrillDownCardSnapshot(
    metricId: MetricId,
    options?: DrillDownCardLocatorOptions,
  ) {
    const card = this.getDrillDownCard(metricId, options);
    await expect(card).toMatchAriaSnapshot(
      getDrillDownCardSnapshot(this.translations, metricId, {
        title: options?.cardTitle,
        description: options?.cardDescription,
      }),
    );
  }

  async expectCardHasMissingPermission(
    metricId: MetricId,
    options?: DrillDownCardLocatorOptions,
  ) {
    const card = this.getDrillDownCard(metricId, options);
    await expect(card).toContainText(
      this.translations.errors.missingPermission,
    );
    await expect(card).toMatchAriaSnapshot(
      getDrillDownMissingPermissionSnapshot(this.translations, metricId),
    );
  }

  async expectTableHasMissingPermission() {
    const msg = getEntitiesPageMissingPermission(this.translations);
    await expect(this.page.locator('tbody')).toContainText(msg);
  }

  async expectCardHasNoDataFound(
    metricId: MetricId,
    options?: DrillDownCardLocatorOptions,
  ) {
    const card = this.getDrillDownCard(metricId, options);
    await expect(card).toContainText(this.translations.errors.noDataFound);
    await expect(card).toMatchAriaSnapshot(
      getDrillDownNoDataFoundSnapshot(this.translations, metricId),
    );
  }

  async expectTableNoDataFound() {
    const noDataText = getEntitiesPageNoDataFound(this.translations);
    await expect(this.page.locator('tbody')).toContainText(noDataText);
  }

  /**
   * When mocks report no calculation failures, the drill-down must not show the
   * calculation-warning icon next to the Entities heading.
   */
  async expectNoDrillDownCalculationErrorWarningIcon() {
    const heading = this.page.getByRole('heading', {
      level: 3,
      name: this.translations.entitiesPage.entitiesTable.title,
    });
    await expect(heading.locator('svg.MuiSvgIcon-colorWarning')).toHaveCount(0);
  }

  async expectTableHeadersVisible() {
    const tableHeaders = getEntitiesTableHeaderLabels(this.translations);
    const headerNames = [
      tableHeaders.status,
      tableHeaders.value,
      tableHeaders.entity,
      tableHeaders.owner,
      tableHeaders.kind,
      tableHeaders.lastUpdated,
    ];
    const entitiesTable = this.getEntitiesTable();
    for (const headerLabel of headerNames) {
      await expect(
        entitiesTable.getByRole('columnheader', { name: headerLabel }),
      ).toBeVisible();
    }
  }

  /**
   * Asserts each entity row is present. Uses the catalog entity link `href`
   * (…/component/&lt;slug&gt;) so it works when the UI shows `metadata.title`
   * (e.g. "Red Hat Developer Hub") instead of `metadata.name` (slug).
   */
  async expectEntityNamesVisible(entityNames: string[]) {
    const entitiesTable = this.getEntitiesTable();
    for (const name of entityNames) {
      const slug = encodeURIComponent(name);
      await expect(
        entitiesTable
          .locator('tbody')
          .locator(`a[href*="/component/${slug}"]`)
          .first(),
      ).toBeVisible({ timeout: 15_000 });
    }
  }

  async verifyMetricColumnSort() {
    const tableHeaders = getEntitiesTableHeaderLabels(this.translations);
    const entitiesTable = this.getEntitiesTable();
    const statusColumnHeader = entitiesTable.getByRole('columnheader', {
      name: tableHeaders.status,
    });

    const { error, success, warning } = this.translations.thresholds;
    const dataRows = entitiesTable.locator('tbody').getByRole('row');

    await statusColumnHeader.click();
    await expect(dataRows.nth(0)).toContainText(error);
    await expect(dataRows.nth(1)).toContainText(success);

    await statusColumnHeader.click();
    await expect(dataRows.nth(0)).toContainText(warning);
  }
}
