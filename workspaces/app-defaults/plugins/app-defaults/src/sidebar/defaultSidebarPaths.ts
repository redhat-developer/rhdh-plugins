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
 * Paths that belong in the default (top) sidebar section, matching the OFS
 * `default.*` main-menu items and RHDH pages that ship enabled by default.
 *
 * Optional / customer-enabled plugin pages are not listed here and therefore
 * render in the middle section.
 */
export const DEFAULT_SIDEBAR_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/catalog',
  '/api-docs',
  '/docs',
  '/learning-paths',
  '/create',
]);

/**
 * Normalizes an internal sidebar path for allowlist comparison.
 * External URLs return `undefined` so they never match the default set.
 */
export function normalizeSidebarPath(
  to: string | undefined,
): string | undefined {
  if (!to || /^https?:\/\//i.test(to)) {
    return undefined;
  }
  let path = to.split(/[?#]/, 1)[0] ?? to;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

/** True when `to` is one of the default (top-section) sidebar paths. */
export function isDefaultSidebarPath(to: string | undefined): boolean {
  const path = normalizeSidebarPath(to);
  return path !== undefined && DEFAULT_SIDEBAR_PATHS.has(path);
}
