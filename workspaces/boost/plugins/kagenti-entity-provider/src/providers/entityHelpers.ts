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
 * Maps a 4-stage agent/tool lifecycle to a Backstage catalog lifecycle string.
 *
 * Draft → experimental, Pending → experimental,
 * Published → production, Archived → deprecated
 *
 * @internal
 */
export function mapLifecycleStage(
  stage?: 'draft' | 'pending' | 'published' | 'archived',
): string {
  switch (stage) {
    case 'draft':
    case 'pending':
      return 'experimental';
    case 'published':
      return 'production';
    case 'archived':
      return 'deprecated';
    default:
      return 'experimental';
  }
}

/**
 * Sanitize a string to be a valid Backstage entity name.
 * Entity names must match /^[a-z0-9]+(-[a-z0-9]+)*$/ (simplified).
 *
 * @internal
 */
export function sanitizeEntityName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63)
    .replace(/-+$/g, '');
  return sanitized || 'unnamed-entity';
}

/**
 * Maps createdBy user reference to a catalog owner ref.
 * Falls back to 'unknown' if not provided.
 *
 * @internal
 */
export function mapOwner(createdBy?: string): string {
  if (!createdBy) {
    return 'unknown';
  }
  // If already a valid entity ref, return as-is
  if (createdBy.includes(':') || createdBy.includes('/')) {
    return createdBy;
  }
  // Otherwise wrap as a user entity ref
  return `user:default/${createdBy}`;
}
