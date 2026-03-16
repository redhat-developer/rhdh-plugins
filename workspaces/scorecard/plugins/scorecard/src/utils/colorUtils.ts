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

import {
  ScorecardThresholdRuleColors,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { Theme } from '@mui/material/styles';
import type { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';

export const getThresholdRuleColor = (
  rules: ThresholdRule[],
  ruleKey: string,
): string | undefined => {
  const rule = rules.find(r => r.key === ruleKey);
  if (rule?.color) {
    return rule.color;
  }

  switch (ruleKey) {
    case 'error':
      return ScorecardThresholdRuleColors.ERROR;
    case 'warning':
      return ScorecardThresholdRuleColors.WARNING;
    case 'success':
      return ScorecardThresholdRuleColors.SUCCESS;
    default:
      return undefined;
  }
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
