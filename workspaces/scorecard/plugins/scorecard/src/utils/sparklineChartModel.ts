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

import type { Theme } from '@mui/material/styles';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import type { ThresholdRule } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardTranslationRef } from '../translations';
import {
  getSparklineLineStyle,
  toSparklineLegendItems,
  type SparklineLegendItem,
} from './sparklineLegend';
import {
  toSparklineChartData,
  type SparklineChartPoint,
  type TimeSeriesChartInputPoint,
} from './timeSeriesChartData';

export type SparklineChartModel = {
  chartData: SparklineChartPoint[];
  chartColor: string;
  strokeDasharray?: string;
  legendItems: SparklineLegendItem[];
};

/**
 * Shared sparkline view-model for entity and homepage cards.
 * Callers map API points first, then pass already-resolved chart color
 * and which threshold rules to show in the legend (`all` vs matched).
 */
export const toSparklineChartModel = ({
  inputPoints,
  formatDateLabel,
  matchingThresholdKey,
  chartColor,
  unit,
  theme,
  t,
  legendRules,
}: {
  inputPoints: TimeSeriesChartInputPoint[];
  formatDateLabel: (timestamp: string) => string;
  matchingThresholdKey?: string;
  chartColor: string;
  unit?: string;
  theme: Theme;
  t: TranslationFunction<typeof scorecardTranslationRef.T>;
  legendRules?: ThresholdRule[];
}): SparklineChartModel => ({
  chartData: toSparklineChartData(inputPoints, formatDateLabel),
  chartColor,
  strokeDasharray: getSparklineLineStyle(matchingThresholdKey).strokeDasharray,
  legendItems: toSparklineLegendItems({
    rules: legendRules,
    theme,
    t,
    unit,
  }),
});
