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
  fromMetricValueRow,
  type MetricValueRowWithId,
} from './mapMetricValueRow';

describe('fromMetricValueRow', () => {
  const baseRow = {
    id: 1,
    catalog_entity_ref: 'component:default/test-service',
    metric_id: 'github.metric1',
    timestamp: new Date('2023-01-01T10:00:00.000Z'),
    status: null,
    entity_kind: null,
    entity_owner: null,
    entity_namespace: null,
  };

  it('coerces JSON-literal null string to JS null', () => {
    const row = {
      ...baseRow,
      value: 'null',
      error_message: 'GitHub API 500',
    } as unknown as MetricValueRowWithId;

    expect(fromMetricValueRow(row)).toMatchObject({
      value: null,
      errorMessage: 'GitHub API 500',
    });
  });

  it('preserves SQL null and numeric values', () => {
    expect(
      fromMetricValueRow({
        ...baseRow,
        value: null,
        error_message: 'boom',
      }),
    ).toMatchObject({ value: null, errorMessage: 'boom' });

    expect(
      fromMetricValueRow({
        ...baseRow,
        value: 42,
        error_message: null,
        status: 'success',
      }),
    ).toMatchObject({ value: 42, errorMessage: null, status: 'success' });
  });
});
