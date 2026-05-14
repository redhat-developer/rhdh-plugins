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

function averageCenterTooltipBreakdownTemplateKey(
  locale: string,
  count: number,
):
  | 'averageCenterTooltipBreakdownRow_one'
  | 'averageCenterTooltipBreakdownRow_other' {
  if (Number.isNaN(count)) {
    return 'averageCenterTooltipBreakdownRow_other';
  }
  // Align with i18next-style pluralization for `metric.averageCenterTooltipBreakdownRow`.
  if (locale.startsWith('fr') && count === 0) {
    return 'averageCenterTooltipBreakdownRow_one';
  }
  if (count === 1) {
    return 'averageCenterTooltipBreakdownRow_one';
  }
  return 'averageCenterTooltipBreakdownRow_other';
}

function expectedAverageCenterTooltipBreakdownLine(
  translations: ScorecardMessages,
  locale: string,
  statusKey: string,
  count: string,
  score: string,
): string {
  const n = Number.parseInt(count, 10);
  const templateKey = averageCenterTooltipBreakdownTemplateKey(locale, n);
  const template = metricCopy(translations, templateKey);
  const status = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
  return interpolate(template, { status, count, score });
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

/** Matches `openPrsWeightedAggregatedResponse.result.values` in scorecardResponseUtils.ts */
const OPEN_PRS_WEIGHTED_MOCK_BREAKDOWN: Array<{
  statusKey: 'success' | 'warning' | 'error';
  count: string;
  score: string;
}> = [
  { statusKey: 'success', count: '3', score: '100' },
  { statusKey: 'warning', count: '5', score: '40' },
  { statusKey: 'error', count: '2', score: '0' },
];

/**
 * Per-status lines under total/max in the center donut tooltip (replaces old side-legend tooltips).
 */
export async function verifyAverageCenterTooltipBreakdownRows(
  page: Page,
  card: Locator,
  translations: ScorecardMessages,
  locale: string,
): Promise<void> {
  await card.getByTestId('average-card-center-percent-hit-area').hover();
  for (const row of OPEN_PRS_WEIGHTED_MOCK_BREAKDOWN) {
    const line = expectedAverageCenterTooltipBreakdownLine(
      translations,
      locale,
      row.statusKey,
      row.count,
      row.score,
    );
    await expect(page.getByText(line)).toBeVisible();
  }
}
