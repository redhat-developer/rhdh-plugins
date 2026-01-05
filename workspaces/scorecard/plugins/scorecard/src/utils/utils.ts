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

export type StatusConfig = {
  color: string;
  icon?: React.ElementType;
};

export type PieData = {
  name: string;
  value: number;
  color: string;
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
}: {
  evaluation: string | null;
  thresholdStatus?: 'success' | 'error';
  metricStatus?: 'success' | 'error';
}): StatusConfig => {
  // If threshold or metric has an error, return grey.400 color
  if (thresholdStatus === 'error' || metricStatus === 'error') {
    return { color: 'rhdh.general.disabled' };
  }

  switch (evaluation) {
    case 'error':
      return { color: 'error.main', icon: DangerousOutlinedIcon };
    case 'warning':
      return { color: 'warning.main', icon: WarningAmberIcon };
    default:
      return { color: 'success.main', icon: CheckCircleOutlineIcon };
  }
};

export type AggregatedMetricValue = {
  count: number;
  name: 'success' | 'warning' | 'error';
};

export type AggregatedMetricResult = {
  id: string;
  status: 'success' | 'error';
  metadata: {
    title: string;
    description: string;
    type: 'object';
    history?: boolean;
  };
  result: {
    values?: AggregatedMetricValue[];
    total: number;
    timestamp: string;
    lastUpdated: string;
  };
};
