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
import type { ThresholdRule } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { SCORECARD_ERROR_STATE_COLOR } from './constants';
import { ElementType } from 'react';
import { getThresholdRuleColor } from './colorUtils';

export type StatusConfig = {
  color: string;
  icon?: ElementType;
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

  switch (evaluation) {
    case 'error':
      return { color, icon: DangerousOutlinedIcon };
    case 'warning':
      return { color, icon: WarningAmberIcon };
    default:
      return { color, icon: CheckCircleOutlineIcon };
  }
};
