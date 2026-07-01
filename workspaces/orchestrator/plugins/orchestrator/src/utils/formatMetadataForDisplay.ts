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

/**
 * Converts boolean values to strings so StructuredMetadataTable shows "true"/"false"
 * instead of emoji checkmarks.
 */
export function formatMetadataForDisplay<T>(value: T): T {
  if (typeof value === 'boolean') {
    return String(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map(formatMetadataForDisplay) as T;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        formatMetadataForDisplay(nestedValue),
      ]),
    ) as T;
  }
  return value;
}
