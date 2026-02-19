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

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import { ThresholdRule } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import type { Theme } from '@mui/material/styles';

export type StatusConfig = {
  color: string;
  icon?: React.ElementType;
};

export type PieData = {
  name: string;
  value: number;
  color?: string;
};

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
      return 'error.main';
    case 'warning':
      return 'warning.main';
    case 'success':
      return 'success.main';
    default:
      return undefined;
  }
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
  // If threshold or metric has an error, return grey.400 color
  if (thresholdStatus === 'error' || metricStatus === 'error') {
    return { color: 'rhdh.general.disabled' };
  }

  let evaluationColor: string | undefined;
  if (thresholdRules && evaluation) {
    evaluationColor = getThresholdRuleColor(thresholdRules, evaluation);
  }
  const color = evaluationColor ?? 'success.main';

  switch (evaluation) {
    case 'error':
      return { color, icon: DangerousOutlinedIcon };
    case 'warning':
      return { color, icon: WarningAmberIcon };
    default:
      return { color, icon: CheckCircleOutlineIcon };
  }
};

/**
 * Resolves a color value from the theme palette or returns a custom color.
 * Supports both theme palette paths (e.g., 'error.main', 'rhdh.general.disabled')
 * and direct color values (e.g., '#FF5733', 'blue', 'rgb(255,0,0)').
 *
 * @param theme - The theme configuration object
 * @param statusColor - Either a theme palette path or a direct color value
 * @param isError - If true, returns the theme's card border color for error states, defaults to false
 * @returns The resolved color string
 */
export const resolveStatusColor = (
  theme: Theme,
  statusColor: string,
  isError: boolean = false,
): string => {
  if (isError) {
    return (
      (theme as ThemeConfig).palette?.rhdh?.general?.cardBorderColor ??
      theme.palette.success.main
    );
  }

  // If statusColor contains a dot, treat it as a theme palette reference
  if (statusColor.includes('.')) {
    const parts = statusColor.split('.');
    let value: any = theme.palette;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) {
        break;
      }
    }

    return typeof value === 'string' ? value : theme.palette.success.main;
  }

  return statusColor;
};

export const getYOffsetForCenterLabel = (lineCount: number) => {
  switch (lineCount) {
    case 2:
      return -17;
    case 3:
      return -24;
    default:
      return -8;
  }
};

export const getHeightForCenterLabel = (lineCount: number) => {
  switch (lineCount) {
    case 2:
      return 48;
    case 3:
      return 56;
    default:
      return 40;
  }
};
