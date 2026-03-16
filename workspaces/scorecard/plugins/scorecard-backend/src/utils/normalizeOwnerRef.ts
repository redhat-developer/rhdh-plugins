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
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';

/**
 * Resolves an owner field to a canonical, lowercase full entity ref.
 *
 * Catalog entities can store `spec.owner` in two forms:
 *   - Short name only:  "my-team"              → "group:default/my-team"
 *   - Full entity ref:  "group:default/my-team" → "group:default/my-team"
 *
 * Normalising to a full ref ensures that owner-based filtering in the
 * drill-down endpoint matches consistently regardless of how the catalog
 * author wrote the value. Kind defaults to "group" and namespace defaults to
 * "default", which matches Backstage's own ownership-resolution behaviour.
 *
 * If the value cannot be parsed as an entity ref, the function falls back to a
 * trimmed, lowercased version of the raw string so that previously-stored data
 * is never silently dropped.
 */
export function normalizeOwnerRef(field: unknown): string | undefined {
  if (typeof field !== 'string') return undefined;
  const trimmed = field.trim();
  if (!trimmed) return undefined;

  try {
    const ref = stringifyEntityRef(
      parseEntityRef(trimmed, {
        defaultKind: 'group',
        defaultNamespace: 'default',
      }),
    ).toLowerCase();
    return ref.length <= 255 ? ref : ref.slice(0, 255);
  } catch {
    // If the value is unparseable fall back to the raw normalised string so
    // we don't silently drop owner data that was already stored correctly.
    const normalized = trimmed.toLowerCase();
    return normalized.length <= 255 ? normalized : normalized.slice(0, 255);
  }
}
