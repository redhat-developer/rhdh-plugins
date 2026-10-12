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

import type {
  MetricResult,
  MetricType,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type DialogMetricResultInput = {
  id: string;
  title: string;
  description: string;
  type: MetricType;
  unit?: string;
  value: MetricResult['result']['value'];
  timestamp: string;
  evaluation: string | null;
  thresholds?: ThresholdConfig;
  status?: MetricResult['status'];
};

/** Builds a MetricResult for the data sources dialog from aggregated or snapshot data. */
export function toDialogMetricResult({
  id,
  title,
  description,
  type,
  unit,
  value,
  timestamp,
  evaluation,
  thresholds,
  status = 'success',
}: DialogMetricResultInput): MetricResult {
  return {
    id,
    status,
    metadata: {
      title,
      description,
      type,
      unit,
    },
    result: {
      value,
      timestamp,
      thresholdResult: {
        status: 'success',
        evaluation,
        definition: thresholds,
      },
    },
  };
}
