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
import {
  AGGREGATED_CARDS_WIDGET_TITLES,
  AGGREGATED_CARDS_METRIC_IDS,
} from '../constants/aggregations';
import { mockApiResponse, waitForAggregationResponse } from './apiUtils';
import { mockAggregationNoDataFound } from './mockHomepageAggregations';

type SetupHomepageAggregationCardOptions = {
  aggregationMetadata: { id: string; title: string };
  route: string;
  response: object;
  status?: number;
};

export async function addWidgets(homePage: HomePage, widgetTitle: string) {
  await homePage.navigateToHome();
  await homePage.enterEditMode();
  await homePage.clearAllCards();
  await homePage.addCard(widgetTitle);
  await homePage.saveChanges();
}

export async function addAggregatedScorecardWidgets(homePage: HomePage) {
  await homePage.navigateToHome();
  await homePage.enterEditMode();
  await homePage.clearAllCards();

  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.jiraMetricId);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.githubMetricId);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.githubOpenPrsKpi);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.jiraOpenIssuesKpi);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.openPrsWeightedKpi);

  await homePage.saveChanges();
}

export async function setupHomepageAggregationCard(
  page: Page,
  homePage: HomePage,
  options: SetupHomepageAggregationCardOptions,
): Promise<void> {
  const { aggregationMetadata, route, response, status } = options;

  await mockApiResponse(page, route, response, status ?? 200);

  await addWidgets(homePage, aggregationMetadata.title);

  // Reload clears the singleton React Query cache
  await page.reload();
}

export async function setupHomepageAllCardsNoData(
  page: Page,
  homePage: HomePage,
): Promise<void> {
  await mockAggregationNoDataFound(page);

  const responseWaits = Object.values(AGGREGATED_CARDS_METRIC_IDS).map(id =>
    waitForAggregationResponse(page, id),
  );

  await addAggregatedScorecardWidgets(homePage);
  await page.reload();
  await Promise.all(responseWaits);
}
