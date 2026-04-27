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

import { expect, Locator, Page } from '@playwright/test';
import type { ScorecardMessages } from './translationUtils';

function metricCopy(translations: ScorecardMessages, key: string): string {
  const metric = translations.metric as unknown as Record<
    string,
    string | undefined
  >;
  return metric[key] ?? key;
}

/** Interpolate `{{key}}` placeholders in a translation template string. */
function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, v),
    template,
  );
}

function averageLegendTooltipEntitiesEachTemplateKey(
  locale: string,
  countStr: string,
):
  | 'averageLegendTooltipEntitiesEach_one'
  | 'averageLegendTooltipEntitiesEach_other' {
  const n = Number.parseInt(countStr, 10);
  if (Number.isNaN(n)) {
    return 'averageLegendTooltipEntitiesEach_other';
  }
  // Align with `getEntityCount` / i18next-style pluralization used in the app.
  if (locale.startsWith('fr') && n === 0) {
    return 'averageLegendTooltipEntitiesEach_one';
  }
  if (n === 1) {
    return 'averageLegendTooltipEntitiesEach_one';
  }
  return 'averageLegendTooltipEntitiesEach_other';
}

export async function expectAverageCardCenterPercent(
  card: Locator,
  percentLabel: string,
): Promise<void> {
  await expect(card.getByTestId('average-card-center-percent')).toHaveText(
    percentLabel,
  );
}

export async function verifyAverageDonutCenterTooltip(
  page: Page,
  card: Locator,
  translations: ScorecardMessages,
  weightedSum: number,
  maxPossible: number,
): Promise<void> {
  await card.getByTestId('average-card-center-percent-hit-area').hover();
  await expect(
    page.getByText(metricCopy(translations, 'averageCenterTooltipTotalLabel'), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(metricCopy(translations, 'averageCenterTooltipMaxLabel'), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(String(weightedSum), { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(String(maxPossible), { exact: true }),
  ).toBeVisible();
}

const AVERAGE_LEGEND_EXPECTED: Record<
  'success' | 'warning' | 'error',
  { count: string; score: string }
> = {
  success: { count: '3', score: '100' },
  warning: { count: '5', score: '40' },
  error: { count: '2', score: '0' },
};

export async function verifyAverageLegendTooltipForStatus(
  page: Page,
  card: Locator,
  translations: ScorecardMessages,
  locale: string,
  statusKey: 'success' | 'warning' | 'error',
): Promise<void> {
  await card.getByTestId(`legend-colorbox-${statusKey}`).hover();
  const { count, score } = AVERAGE_LEGEND_EXPECTED[statusKey];
  const templateKey = averageLegendTooltipEntitiesEachTemplateKey(
    locale,
    count,
  );
  const entitiesLabel = interpolate(metricCopy(translations, templateKey), {
    count,
    score,
  });
  await expect(page.getByText(entitiesLabel)).toBeVisible();
}
