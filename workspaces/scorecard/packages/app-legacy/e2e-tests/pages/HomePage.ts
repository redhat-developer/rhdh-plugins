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
import { AGGREGATED_CARDS_WIDGET_TITLES } from '../constants/aggregations';
import {
  ScorecardMessages,
  getEntityCount,
  getHomepageEntityCalculationHealthText,
  getLastUpdatedLabel,
} from '../utils/translationUtils';

type ThresholdState = 'success' | 'warning' | 'error';
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class HomePage {
  readonly page: Page;
  readonly translations: ScorecardMessages;
  readonly locale: string;

  constructor(page: Page, translations: ScorecardMessages, locale: string) {
    this.page = page;
    this.translations = translations;
    this.locale = locale;
  }

  async navigateToHome() {
    await this.page.getByRole('link', { name: 'Home' }).first().click();
  }

  async enterEditMode() {
    await this.page.getByRole('button', { name: 'Edit' }).click();
  }

  async clearAllCards() {
    await this.page.getByRole('button', { name: 'Clear all' }).click();
  }

  private async openAddWidgetDialog() {
    await this.page.getByRole('button', { name: 'Add widget' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Add new widget to dashboard' }),
    ).toBeVisible();
  }

  /**
   * NFS homepage only ships one Scorecard widget. Add it, then set Aggregation ID
   * in the card settings so the card test id matches that id.
   * Call this while the homepage is already in edit mode.
   */
  async addScorecardCard(aggregationId: string) {
    await this.openAddWidgetDialog();
    await this.page.getByRole('button', { name: /^Scorecard(?!:)/ }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Add new widget to dashboard' }),
    ).toBeHidden();

    // A card with no aggregation id renders nothing, so it has no
    // scorecard-homepage-card- test id yet. The new widget is appended last;
    // the first overlay button is its settings gear.
    const settingsButton = this.page
      .locator('.react-grid-item')
      .last()
      .locator('.overlayGridItem')
      .first()
      .getByRole('button');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    const dialog = this.page.locator('.widgetSettingsDialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Aggregation ID').fill(aggregationId);
    await dialog.getByRole('button', { name: 'Submit' }).click();
    await expect(dialog).toBeHidden();
  }

  async addCard(cardName: string) {
    await this.openAddWidgetDialog();

    let cardPattern: RegExp;
    if (cardName === 'Onboarding section') {
      cardPattern =
        /Onboarding section|RhdhOnboardingSection|Red Hat Developer Hub - Onboarding/i;
    } else if (cardName === 'Scorecard: GitHub open PRs') {
      cardPattern = /Scorecard:\s*GitHub open PRs|ScorecardGithubHomepage/i;
    } else if (cardName === 'Scorecard: Jira open blocking') {
      cardPattern = /Scorecard:\s*Jira open blocking|ScorecardJiraHomepage/i;
    } else if (
      cardName === AGGREGATED_CARDS_WIDGET_TITLES.gitHubOpenPrsWeightedKpi
    ) {
      cardPattern =
        /Scorecard:\s*GitHub open PRs \(weighted health\)|ScorecardGitHubOpenPrsWeightedKpi/i;
    } else if (
      cardName === AGGREGATED_CARDS_WIDGET_TITLES.licenseFileExistsKpi
    ) {
      cardPattern =
        /Scorecard:\s*LICENSE file exists|scorecard-filecheck\.license/i;
    } else {
      cardPattern = new RegExp(escapeRegex(cardName), 'i');
    }

    await this.page.getByRole('button', { name: cardPattern }).first().click();
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async expectCardVisible(instanceId: string) {
    await expect(this.getCard(instanceId)).toBeVisible();
  }

  async expectCardNotVisible(instanceId: string) {
    await expect(this.getCard(instanceId)).not.toBeVisible();
  }

  getCard(instanceId: string): Locator {
    return this.page.getByTestId(`scorecard-homepage-card-${instanceId}`);
  }

  async verifyThresholdTooltip(
    card: Locator,
    state: ThresholdState,
    entityCount: string,
    percentage: string,
  ) {
    const stateLabel = this.translations.thresholds[state];
    await card.getByText(stateLabel, { exact: true }).first().hover();
    await expect(
      this.page.getByText(
        getEntityCount(this.translations, this.locale, entityCount),
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      this.page.getByText(percentage, { exact: true }),
    ).toBeVisible();
  }

  async expectCardHasMissingPermission(instanceId: string) {
    const card = this.getCard(instanceId);
    await expect(card).toContainText(
      this.translations.errors.missingPermission,
    );
  }

  async expectCardHasNoDataFound(instanceId: string) {
    const card = this.getCard(instanceId);
    await expect(card).toContainText(this.translations.errors.noDataFound);
  }

  async verifyLastUpdatedTooltip(card: Locator, formattedTimestamp: string) {
    const label = getLastUpdatedLabel(this.translations, formattedTimestamp);
    const infoIcon = card.getByTestId('scorecard-homepage-card-info');
    await expect(infoIcon).toBeVisible();
    await infoIcon.hover();
    await expect(this.page.getByText(label)).toBeVisible();
  }

  /**
   * Clicks the homepage KPI drill-down link (healthy/total subheader) within a card.
   * Defaults to 10/10 (plain “10 entities” link). Pass overrides when mock `result.total` differs.
   */
  async clickDrillDownLink(
    card: Locator,
    options?: { healthy?: string; total?: string },
  ) {
    const healthy = options?.healthy ?? '10';
    const total = options?.total ?? '10';
    const name = getHomepageEntityCalculationHealthText(
      this.translations,
      healthy,
      total,
    );
    await card.getByRole('link', { name }).click();
  }

  async openDataSourcesDialog(card: Locator): Promise<Locator> {
    await card.getByLabel(this.translations.card.menuAriaLabel).click();
    await this.page.getByText(this.translations.card.viewDataSources).click();
    const dialog = this.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    return dialog;
  }

  async closeDataSourcesDialog(dialog: Locator) {
    await dialog.getByText(this.translations.dataSourcesDialog.close).click();
    await expect(dialog).not.toBeVisible();
  }
}
