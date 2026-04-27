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
import { AGGREGATED_CARDS_WIDGET_TITLES } from '../constants/homepageWidgetTitles';
import {
  ScorecardMessages,
  getEntitiesLabel,
  getEntityCount,
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

  async addCard(cardName: string) {
    await this.page.getByRole('button', { name: 'Add widget' }).click();
    await expect(
      this.page.getByRole('heading', { name: 'Add new widget to dashboard' }),
    ).toBeVisible();

    let cardPattern: RegExp;
    if (cardName === 'Onboarding section') {
      cardPattern = /Onboarding section|RhdhOnboardingSection/i;
    } else if (cardName === 'Scorecard: GitHub open PRs') {
      cardPattern = /Scorecard:\s*GitHub open PRs|ScorecardGithubHomepage/i;
    } else if (cardName === 'Scorecard: Jira open blocking') {
      cardPattern = /Scorecard:\s*Jira open blocking|ScorecardJiraHomepage/i;
    } else if (
      cardName === AGGREGATED_CARDS_WIDGET_TITLES.withOpenPrsWeightedKpi
    ) {
      cardPattern =
        /Scorecard:\s*GitHub open PRs \(weighted health\)|ScorecardOpenPrsWeightedKpi/i;
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

  async clickDrillDownLink() {
    // CardSubheader renders the count as a Link (e.g. "10 entities"). The card
    // description can also contain the word "entities" (see API metadata), so
    // getByText(entitiesLabel) is ambiguous. MUI Tooltip also sets the link’s
    // accessible name to the long tooltip, so getByRole('link', { name }) is
    // locale‑fragile. Match only links whose *visible* text is "{{count}} <label>".
    const entitiesLabel = getEntitiesLabel(this.translations);
    await this.page
      .getByRole('link')
      .filter({
        hasText: new RegExp(
          String.raw`^\d+\s*${escapeRegex(entitiesLabel)}$`,
          'i',
        ),
      })
      .first()
      .click();
  }
}
