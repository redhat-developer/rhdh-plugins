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

import type { HomePage } from '../pages/HomePage';
import { AGGREGATED_CARDS_WIDGET_TITLES } from '../constants/homepageWidgetTitles';

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

  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withDeprecatedMetricId);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withDefaultAggregation);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withJiraOpenIssuesKpi);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withOpenPrsWeightedKpi);

  await homePage.saveChanges();
}
