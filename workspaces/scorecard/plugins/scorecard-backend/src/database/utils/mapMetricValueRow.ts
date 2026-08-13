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

import type { MetricValue } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { DbMetricValue, DbMetricValueCreate } from '../types';
import { parseTimestamp } from '../../utils/normalizeTimestamp';

export type MetricValueRow = {
  catalog_entity_ref: string;
  metric_id: string;
  value?: MetricValue | null;
  timestamp: Date;
  error_message?: string | null;
  status?: string | null;
  entity_kind?: string | null;
  entity_owner?: string | null;
  entity_namespace?: string | null;
};

export type MetricValueRowWithId = MetricValueRow & {
  id: number;
  value: DbMetricValue['value'];
  error_message: string | null;
  status: string | null;
  entity_kind: string | null;
  entity_owner: string | null;
  entity_namespace: string | null;
};

export type DbMetricValueCreateInput = Omit<
  DbMetricValueCreate,
  'value' | 'errorMessage' | 'entityKind' | 'entityOwner' | 'entityNamespace'
> & {
  value?: MetricValue | null;
  errorMessage?: string | null;
  entityKind?: string | null;
  entityOwner?: string | null;
  entityNamespace?: string | null;
};

export function toMetricValueRow(
  value: DbMetricValueCreateInput,
): MetricValueRow {
  return {
    catalog_entity_ref: value.catalogEntityRef,
    metric_id: value.metricId,
    value: value.value,
    timestamp: value.timestamp,
    error_message: value.errorMessage,
    status: value.status,
    entity_kind: value.entityKind,
    entity_owner: value.entityOwner,
    entity_namespace: value.entityNamespace,
  };
}

export function fromMetricValueRow(row: MetricValueRowWithId): DbMetricValue {
  return {
    id: row.id,
    catalogEntityRef: row.catalog_entity_ref,
    metricId: row.metric_id,
    value: row.value,
    timestamp: parseTimestamp(row.timestamp),
    errorMessage: row.error_message,
    status: row.status,
    entityKind: row.entity_kind,
    entityOwner: row.entity_owner,
    entityNamespace: row.entity_namespace,
  };
}
