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
 * Shared project-naming utilities.
 *
 * This file lives under `lib/` (shipped in the package) so that both
 * migration scripts and the compiled `dist/` bundle can use it at
 * runtime in a dynamic-plugin environment where `src/` is not available.
 *
 * The main `Project` class in `src/services/` delegates to these functions.
 *
 * Unit tests are in workspaces/x2a/plugins/x2a-backend/src/services/Project.test.ts
 */

export const MAX_BASE_NAME_LENGTH = 64;
export const SHORT_ID_LENGTH = 6;
export const DEFAULT_BASE_NAME = 'project';

/**
 * Sanitize a project name into a safe directory-component string.
 *
 * Rules:
 *  - Lowercased
 *  - Non-alphanumeric characters (except dash) replaced with dash
 *  - Consecutive dashes collapsed
 *  - Leading/trailing dashes removed
 *  - Truncated to 64 characters
 *  - Falls back to "project" if empty after sanitization
 *
 * Uses manual iteration for trimming to prevent ReDoS (O(n) guaranteed).
 */
export function sanitizeBaseName(projectName: string): string {
  let sanitized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-');

  let start = 0;
  while (start < sanitized.length && sanitized[start] === '-') {
    start++;
  }
  sanitized = sanitized.substring(start);

  let end = sanitized.length;
  while (end > 0 && sanitized[end - 1] === '-') {
    end--;
  }
  sanitized = sanitized.substring(0, end);

  sanitized = sanitized.substring(0, MAX_BASE_NAME_LENGTH);

  while (sanitized.length > 0 && sanitized[sanitized.length - 1] === '-') {
    sanitized = sanitized.substring(0, sanitized.length - 1);
  }

  return sanitized || DEFAULT_BASE_NAME;
}

/** Directory name for a project: `<baseName>-<shortId>` */
export function computeDirName(id: string, projectName: string): string {
  const baseName = sanitizeBaseName(projectName);
  const shortId = id.substring(0, SHORT_ID_LENGTH);
  return `${baseName}-${shortId}`;
}
