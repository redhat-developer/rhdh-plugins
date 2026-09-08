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

export type TechDocsEntityParts = {
  namespace: string;
  kind: string;
  name: string;
};

const MAX_SEGMENT_LENGTH = 256;

/**
 * Catalog-like entity path segment. Rejects traversal (`..`), slashes, and
 * other characters that must not be interpolated into a URL path.
 */
const ENTITY_PATH_SEGMENT_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,254}[A-Za-z0-9])?$/;

export function isSafeTechDocsEntitySegment(value: string): boolean {
  if (value.length === 0 || value.length > MAX_SEGMENT_LENGTH) {
    return false;
  }
  if (value === '.' || value === '..') {
    return false;
  }
  if (value.includes('/') || value.includes('\\')) {
    return false;
  }
  return ENTITY_PATH_SEGMENT_PATTERN.test(value);
}

/**
 * Returns true when `url` stays under the TechDocs metadata path for `base`
 * after URL parsing / path normalization (defense against traversal).
 */
export function isTechDocsMetadataUrlContained(
  url: string,
  base: string,
): boolean {
  try {
    const parsed = new URL(url);
    const basePath = new URL(base).pathname.replace(/\/$/, '');
    return parsed.pathname.startsWith(`${basePath}/metadata/techdocs/`);
  } catch {
    return false;
  }
}

/**
 * Builds the TechDocs metadata URL for an entity. Returns `undefined` when any
 * path segment is unsafe so callers must skip the outbound request.
 */
export function buildTechDocsMetadataUrl(
  techdocsBaseUrl: string,
  parts: TechDocsEntityParts,
): string | undefined {
  const { namespace, kind, name } = parts;
  if (
    !isSafeTechDocsEntitySegment(namespace) ||
    !isSafeTechDocsEntitySegment(kind) ||
    !isSafeTechDocsEntitySegment(name)
  ) {
    return undefined;
  }

  const base = techdocsBaseUrl.endsWith('/')
    ? techdocsBaseUrl.slice(0, -1)
    : techdocsBaseUrl;
  const path = `/metadata/techdocs/${encodeURIComponent(
    namespace,
  )}/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`;
  const url = `${base}${path}`;

  if (!isTechDocsMetadataUrlContained(url, base)) {
    return undefined;
  }
  return url;
}
