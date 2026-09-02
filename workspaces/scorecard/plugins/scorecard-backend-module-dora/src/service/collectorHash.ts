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

import { createHash } from 'node:crypto';
import type { JsonObject, JsonValue } from '@backstage/types';

function canonicalize(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return 'null';
  }
  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map(k => `${JSON.stringify(k)}:${canonicalize(value[k])}`)
    .join(',')}}`;
}

/**
 * Hash of the collector's static config input. `{}` and undefined hash identically.
 */
export function collectorInputHash(input?: JsonObject): string {
  return createHash('sha256')
    .update(canonicalize(input ?? {}))
    .digest('hex');
}
