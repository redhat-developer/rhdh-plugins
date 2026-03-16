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

import { createHash } from 'crypto';
import type { Json, ToolFingerprint } from './types';

/**
 * Produce deterministic JSON for hashing. Keys are sorted recursively
 * to ensure identical output regardless of insertion order.
 * Matches Python ToolScope's stable_json(obj) output exactly for
 * cross-language fingerprint compatibility.
 */
export function stableJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  });
}

/**
 * Compute a stable fingerprint for a tool definition.
 * The fingerprint changes when the tool meaningfully changes.
 * Uses the same field layout as Python ToolScope for cross-language compat.
 */
export function fingerprintTool(
  name: string,
  description: string,
  inputSchema: Json,
  extra?: Json,
): ToolFingerprint {
  const base = {
    name,
    description,
    input_schema: inputSchema,
    extra: extra ?? {},
  };
  const hash = createHash('sha256').update(stableJson(base)).digest('hex');
  return { value: hash };
}
