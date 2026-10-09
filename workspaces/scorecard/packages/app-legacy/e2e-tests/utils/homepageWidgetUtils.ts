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

import type { Page } from '@playwright/test';
import type { HomePage } from '../pages/HomePage';
import { AGGREGATED_CARDS_METRIC_IDS } from '../constants/aggregations';
import { mockApiResponse, waitForAggregationResponse } from './apiUtils';
import { mockAggregationNoDataFound } from './mockHomepageAggregations';

type AggregatedCardWidgetKey = keyof typeof AGGREGATED_CARDS_METRIC_IDS;

function isAggregatedCardWidgetKey(
  key: string,
): key is AggregatedCardWidgetKey {
  return key in AGGREGATED_CARDS_METRIC_IDS;
}

type SetupHomepageAggregationCardOptions = {
  aggregationMetadata: { id: string; title: string };
  route: string;
  response: object;
  status?: number;
};

const isNfs = () => process.env.APP_MODE === 'nfs';

async function addWidget(
  homePage: HomePage,
  aggregationMetadata: { id: string; title: string },
) {
  await homePage.navigateToHome();
  if (!isNfs()) {
    return;
  }

  await homePage.enterEditMode();
  await homePage.clearAllCards();
  await homePage.addScorecardCard(aggregationMetadata.id);
  await homePage.saveChanges();
}

export async function addAggregatedScorecardWidgets(
  homePage: HomePage,
  widgetIds: Partial<
    typeof AGGREGATED_CARDS_METRIC_IDS
  > = AGGREGATED_CARDS_METRIC_IDS,
) {
  await homePage.navigateToHome();
  if (!isNfs()) {
    return;
  }

  await homePage.enterEditMode();
  await homePage.clearAllCards();

  for (const instanceId of Object.keys(widgetIds)) {
    if (!isAggregatedCardWidgetKey(instanceId)) {
      throw new Error(`Unknown homepage scorecard widget id: ${instanceId}`);
    }
    await homePage.addScorecardCard(
      widgetIds[instanceId] ?? AGGREGATED_CARDS_METRIC_IDS[instanceId],
    );
  }

  await homePage.saveChanges();
}

export async function setupHomepageAggregationCard(
  page: Page,
  homePage: HomePage,
  options: SetupHomepageAggregationCardOptions,
): Promise<void> {
  const { aggregationMetadata, route, response, status } = options;

  await mockApiResponse(page, route, response, status ?? 200);

  await addWidget(homePage, aggregationMetadata);

  // Reload clears the singleton React Query cache
  await page.reload();
}

export async function setupHomepageAllCardsNoData(
  page: Page,
  homePage: HomePage,
): Promise<void> {
  await mockAggregationNoDataFound(page);

  await addAggregatedScorecardWidgets(homePage);

  const responseWaits = Object.values(AGGREGATED_CARDS_METRIC_IDS).map(id =>
    waitForAggregationResponse(page, id),
  );

  await Promise.all([page.reload(), ...responseWaits]);
}
