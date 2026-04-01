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
import type { ThresholdRule } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';

import { SCORECARD_ERROR_STATE_COLOR } from './constants';
import { getThresholdRuleColor, getThresholdRuleIcon } from './thresholdUtils';

export type StatusConfig = {
  color: string;
  icon?: string;
};

/**
 * @param evaluation - The evaluation status of the metric.
 * colors are mapped to MUI palette strings (e.g., 'error.main', 'warning.main', 'success.main').
 * @returns StatusConfig
 */
export const getStatusConfig = ({
  evaluation,
  thresholdStatus,
  metricStatus,
  thresholdRules,
}: {
  evaluation: string | null;
  thresholdStatus?: 'success' | 'error';
  metricStatus?: 'success' | 'error';
  thresholdRules?: ThresholdRule[];
}): StatusConfig => {
  // If threshold or metric has an error, return error state color
  if (thresholdStatus === 'error' || metricStatus === 'error') {
    return { color: SCORECARD_ERROR_STATE_COLOR };
  }

  let evaluationColor: string | undefined;
  if (thresholdRules && evaluation) {
    evaluationColor = getThresholdRuleColor(thresholdRules, evaluation);
  }
  const color = evaluationColor ?? SCORECARD_ERROR_STATE_COLOR;
  const icon =
    thresholdRules && evaluation
      ? getThresholdRuleIcon(thresholdRules, evaluation)
      : undefined;
  return { color, icon };
};

/**
 * Resolves a color value from the theme palette or returns a custom color.
 * Supports theme palette paths (e.g., 'error.main', 'rhdh.general.cardBorderColor')
 * and direct color values (e.g., '#FF5733', 'blue', 'rgb(255,0,0)').
 *
 * @param theme - The theme configuration object
 * @param statusColor - Either a theme palette path or a direct color value
 * @returns The resolved color string
 */
export const resolveStatusColor = (
  theme: Theme,
  statusColor: string,
): string => {
  // Theme palette paths are dot-separated; rgba(...) may include '.' in its alpha value.
  if (!statusColor.includes('.') || statusColor.includes('rgba')) {
    return statusColor;
  }

  // Resolve theme palette reference
  const parts = statusColor.split('.');
  let value: any = theme.palette;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) {
      break;
    }
  }

  if (typeof value === 'string') {
    return value;
  }

  // Fallback to error state color, then error.main
  return (
    (theme as ThemeConfig).palette?.rhdh?.general?.cardBorderColor ??
    theme.palette.error.main
  );
};
