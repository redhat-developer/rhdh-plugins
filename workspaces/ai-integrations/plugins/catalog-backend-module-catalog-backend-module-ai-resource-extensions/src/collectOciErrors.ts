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

/**
 * Collects OCI-related validation errors for an AIResource entity
 * without throwing. Returns an array of error messages (empty if valid).
 *
 * @internal
 */
export function collectOciErrors(entity: Entity): string[] {
  const specLocation = (entity.spec as Record<string, unknown> | undefined)
    ?.location as Record<string, unknown> | undefined;

  if (specLocation?.type !== 'oci') {
    return [];
  }

  const target = specLocation?.target;

  if (typeof target !== 'string' || target.trim() === '') {
    return [
      'spec.location.target must be a non-empty string with an oci:// URI (e.g. oci://quay.io/org/model:tag)',
    ];
  }

  if (target !== target.trim()) {
    return [
      'spec.location.target must not have leading or trailing whitespace (e.g. oci://quay.io/org/model:tag)',
    ];
  }

  if (!target.startsWith('oci://')) {
    const sanitized = Array.from(String(target))
      .filter(c => c.charCodeAt(0) > 0x1f)
      .join('')
      .slice(0, 200);
    return [
      `spec.location.target '${sanitized}' must start with the oci:// prefix (e.g. oci://quay.io/org/model:tag)`,
    ];
  }

  const ociPath = target.slice('oci://'.length);
  const parts = ociPath.split('/');

  // Reject missing registry/repo, empty segments (e.g. trailing slash),
  // and whitespace inside path segments (e.g. oci:// quay.io/...).
  if (parts.length < 2 || parts.some(part => part === '' || /\s/.test(part))) {
    const sanitized = Array.from(String(target))
      .filter(c => c.charCodeAt(0) > 0x1f)
      .join('')
      .slice(0, 200);
    return [
      `spec.location.target '${sanitized}' is not a valid OCI reference; expected format oci://registry/repository[:tag|@digest]`,
    ];
  }

  return [];
}
