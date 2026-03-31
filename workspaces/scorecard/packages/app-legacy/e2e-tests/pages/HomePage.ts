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
  getEntityCount,
  getLastUpdatedLabel,
} from '../utils/translationUtils';

type ThresholdState = 'success' | 'warning' | 'error';

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
    await this.page.getByRole('button', { name: cardName }).click();
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
}
