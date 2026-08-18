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
  ANNOTATION_SOURCE_LOCATION,
  Entity,
  parseLocationRef,
} from '@backstage/catalog-model';

/**
 * Collects OCI-related validation errors for an AiResource entity
 * without throwing. Returns an array of error messages (empty if valid).
 *
 * Validates the `backstage.io/source-location` annotation when its
 * location-ref target uses the `oci://` scheme. The annotation must
 * use the Backstage location-ref form `url:oci://…`.
 *
 * Uses upstream `parseLocationRef` for parsing, which normalizes
 * leading/trailing whitespace around type and target.
 *
 * @internal
 */
export function collectOciErrors(entity: Entity): string[] {
  const annotation = entity.metadata?.annotations?.[ANNOTATION_SOURCE_LOCATION];

  if (annotation === undefined || annotation === null) {
    return [];
  }

  let type: string;
  let target: string;
  try {
    ({ type, target } = parseLocationRef(annotation));
  } catch {
    // Not a valid location-ref (no colon, empty type/target, etc.)
    // Leave it for other processors to handle.
    return [];
  }

  // Detect bare `oci://…` without the required `url:` prefix.
  // parseLocationRef parses `oci://host/path` as type `oci` with a
  // non-URL target, which breaks future UrlReader integration.
  if (type === 'oci') {
    const sanitized = Array.from(annotation.trim())
      .filter(c => c.charCodeAt(0) > 0x1f)
      .join('')
      .slice(0, 200);
    return [
      `${ANNOTATION_SOURCE_LOCATION} '${sanitized}' uses a bare oci:// URI; ` +
        `the Backstage location-ref form url:oci://… is required ` +
        `(e.g. url:oci://quay.io/org/model:tag)`,
    ];
  }

  // Only apply OCI validation when the location-ref type is `url` and
  // the target starts with `oci://`.
  if (type !== 'url' || !target.startsWith('oci://')) {
    return [];
  }

  const ociPath = target.slice('oci://'.length);

  if (ociPath === '') {
    return [
      `${ANNOTATION_SOURCE_LOCATION} target 'oci://' is not a valid OCI ` +
        `reference; expected format url:oci://registry/repository[:tag|@digest]`,
    ];
  }

  const parts = ociPath.split('/');

  // Reject missing registry/repo, empty segments (e.g. trailing slash),
  // and whitespace inside path segments (e.g. oci:// quay.io/...).
  if (parts.length < 2 || parts.some(part => part === '' || /\s/.test(part))) {
    const sanitized = Array.from(target)
      .filter(c => c.charCodeAt(0) > 0x1f)
      .join('')
      .slice(0, 200);
    return [
      `${ANNOTATION_SOURCE_LOCATION} target '${sanitized}' is not a valid ` +
        `OCI reference; expected format ` +
        `url:oci://registry/repository[:tag|@digest]`,
    ];
  }

  return [];
}
