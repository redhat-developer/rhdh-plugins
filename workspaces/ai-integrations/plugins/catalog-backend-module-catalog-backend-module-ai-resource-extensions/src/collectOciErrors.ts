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

import { Entity } from '@backstage/catalog-model';

const SOURCE_LOCATION_ANNOTATION = 'backstage.io/source-location';

/**
 * Collects OCI-related validation errors for an AIResource entity
 * without throwing. Returns an array of error messages (empty if valid).
 *
 * Validates the `backstage.io/source-location` annotation when its
 * location-ref target uses the `oci://` scheme. The annotation must
 * use the Backstage location-ref form `url:oci://…`.
 *
 * @internal
 */
export function collectOciErrors(entity: Entity): string[] {
  const annotation = entity.metadata?.annotations?.[
    SOURCE_LOCATION_ANNOTATION
  ] as string | undefined;

  if (annotation === undefined || annotation === null) {
    return [];
  }

  const raw = String(annotation);

  // Detect bare `oci://…` without the required `url:` prefix.
  // A bare `oci://…` parses as location type `oci` with a non-URL target,
  // which breaks future UrlReader integration.
  if (raw.trimStart().startsWith('oci://')) {
    const sanitized = Array.from(raw.trim())
      .filter(c => c.charCodeAt(0) > 0x1f)
      .join('')
      .slice(0, 200);
    return [
      `${SOURCE_LOCATION_ANNOTATION} '${sanitized}' uses a bare oci:// URI; ` +
        `the Backstage location-ref form url:oci://… is required ` +
        `(e.g. url:oci://quay.io/org/model:tag)`,
    ];
  }

  // Parse the annotation as a Backstage location-ref: `type:target`
  const colonIdx = raw.indexOf(':');
  if (colonIdx < 0) {
    // Not a valid location-ref, but not OCI — leave it for other
    // processors to handle.
    return [];
  }

  const locationType = raw.slice(0, colonIdx);
  const target = raw.slice(colonIdx + 1);

  // Only apply OCI validation when the location-ref type is `url` and
  // the target starts with `oci://`.
  if (locationType !== 'url' || !target.startsWith('oci://')) {
    return [];
  }

  if (target !== target.trim()) {
    return [
      `${SOURCE_LOCATION_ANNOTATION} target must not have leading or ` +
        `trailing whitespace (e.g. url:oci://quay.io/org/model:tag)`,
    ];
  }

  const ociPath = target.slice('oci://'.length);

  if (ociPath === '') {
    return [
      `${SOURCE_LOCATION_ANNOTATION} target 'oci://' is not a valid OCI ` +
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
      `${SOURCE_LOCATION_ANNOTATION} target '${sanitized}' is not a valid ` +
        `OCI reference; expected format ` +
        `url:oci://registry/repository[:tag|@digest]`,
    ];
  }

  return [];
}
