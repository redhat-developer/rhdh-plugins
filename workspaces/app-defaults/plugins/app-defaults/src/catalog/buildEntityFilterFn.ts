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

import type { Entity } from '@backstage/catalog-model';

/**
 * Combines NFS entity-card filter outputs the same way the stock Overview tab does.
 * Cards register predicate objects as `filterFunction`; legacy string expressions
 * are deprecated and are not resolved here.
 */
export function buildEntityFilterFn(
  filterFunction?: (entity: Entity) => boolean,
  filterExpression?: string,
): (entity: Entity) => boolean {
  if (filterFunction && filterExpression) {
    return filterFunction;
  }
  if (filterFunction) {
    return filterFunction;
  }
  if (filterExpression) {
    return () => false;
  }
  return () => true;
}
