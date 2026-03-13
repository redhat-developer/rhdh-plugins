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

import { MetricValue } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type DbMetricValueCreate = {
  catalog_entity_ref: string;
  metric_id: string;
  value?: MetricValue;
  timestamp: Date;
  error_message?: string;
  status?: string | null;
  entity_kind?: string;
  entity_owner?: string;
  entity_namespace?: string;
};

export type DbMetricValue = {
  id: number;
  catalog_entity_ref: string;
  metric_id: string;
  value: MetricValue | null;
  timestamp: Date;
  error_message: string | null;
  status: string | null;
  entity_kind: string | null;
  entity_owner: string | null;
  entity_namespace: string | null;
};

export type DbAggregatedMetric = {
  metric_id: string;
  total: number;
  max_timestamp: Date;
  statusCounts: Record<string, number>;
};
