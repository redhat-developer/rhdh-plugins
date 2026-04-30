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

import type { DbMetricValue } from '../database/types';

/**
 * True when the persisted latest row represents a provider-side calculation failure,
 * aligned with `CatalogMetricService.getLatestEntityMetrics`.
 */
export function isMetricCalculationError(row: {
  value: DbMetricValue['value'];
  error_message: DbMetricValue['error_message'];
}): boolean {
  return row.error_message !== null && row.value === null;
}
