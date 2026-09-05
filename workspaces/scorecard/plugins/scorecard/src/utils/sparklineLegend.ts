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
import { SCORECARD_ERROR_STATE_COLOR } from './constants';
import { formatWithMetricUnit } from './formatMetricUnit';
import { getTranslatedStatus, resolveStatusColor } from './statusUtils';
import { getThresholdRuleColor } from './thresholdUtils';

export type SparklineLegendItem = {
  key: string;
  color: string;
  label: string;
  strokeDasharray?: string;
};

export const SPARKLINE_DASHED_STROKE = '10 7';
export const SPARKLINE_DOTTED_STROKE = '4 4';

const BOOLEAN_EXPRESSION = /^==(?:true|false)$/;

export const formatThresholdLegendLabel = (
  rule: Pick<ThresholdRule, 'key' | 'expression'>,
  t: TranslationFunction<typeof scorecardTranslationRef.T>,
  unit?: string,
): string => {
  const name = getTranslatedStatus(rule.key, t);
  if (!rule.expression || BOOLEAN_EXPRESSION.test(rule.expression)) {
    return name;
  }
  return `${name} (${formatWithMetricUnit(rule.expression, unit)})`;
};

/**
 * Line style for a threshold band. Elite/success are dashed, medium/warning
 * are dotted, and low/error are solid — matching the homepage legend.
 */
export const getSparklineLineStyle = (
  thresholdKey?: string,
  index = 0,
): { strokeDasharray?: string } => {
  const key = thresholdKey?.toLowerCase();
  if (key === 'elite' || key === 'success') {
    return { strokeDasharray: SPARKLINE_DASHED_STROKE };
  }
  if (key === 'medium' || key === 'warning') {
    return { strokeDasharray: SPARKLINE_DOTTED_STROKE };
  }
  if (key === 'low' || key === 'error') {
    return {};
  }
  if (index === 0) {
    return { strokeDasharray: SPARKLINE_DASHED_STROKE };
  }
  if (index === 1) {
    return { strokeDasharray: SPARKLINE_DOTTED_STROKE };
  }
  return {};
};

export const toSparklineLegendItems = ({
  rules,
  theme,
  t,
  unit,
}: {
  rules?: ThresholdRule[];
  theme: Theme;
  t: TranslationFunction<typeof scorecardTranslationRef.T>;
  unit?: string;
}): SparklineLegendItem[] => {
  if (!rules?.length) {
    return [];
  }

  return rules.map((rule, index) => {
    const colorToken =
      getThresholdRuleColor(rules, rule.key) ?? SCORECARD_ERROR_STATE_COLOR;
    return {
      key: rule.key,
      label: formatThresholdLegendLabel(rule, t, unit),
      color: resolveStatusColor(theme, colorToken),
      strokeDasharray: getSparklineLineStyle(rule.key, index).strokeDasharray,
    };
  });
};
