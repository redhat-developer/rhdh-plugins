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
 * Default (top-section) sidebar paths with OFS `DefaultMainMenuItems` priorities
 * from RHDH `packages/app/src/consts.ts` (e.g. 1.10.5):
 * Home 100, Catalog 80, APIs 70, Learning Paths 60, Create 50.
 *
 * `/docs` is an NFS default page not listed in OFS consts; it sits between APIs
 * and Learning Paths. Optional / customer-enabled plugin pages are omitted and
 * therefore render in the middle section at priority 0 unless configured.
 */
export const DEFAULT_SIDEBAR_PATH_PRIORITIES: Readonly<Record<string, number>> =
  {
    '/': 100,
    '/catalog': 80,
    '/api-docs': 70,
    '/docs': 65,
    '/learning-paths': 60,
    '/create': 50,
  };

/** Paths that belong in the default (top) sidebar section. */
export const DEFAULT_SIDEBAR_PATHS: ReadonlySet<string> = new Set(
  Object.keys(DEFAULT_SIDEBAR_PATH_PRIORITIES),
);

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

/**
 * Resolves sidebar priority for a path. An explicit priority always wins;
 * otherwise OFS/NFS default-path priorities apply, then `0`.
 */
export function defaultSidebarPathPriority(
  to: string | undefined,
  explicitPriority?: number,
): number {
  if (explicitPriority !== undefined) {
    return explicitPriority;
  }
  const path = normalizeSidebarPath(to);
  if (path !== undefined) {
    const pathPriority = DEFAULT_SIDEBAR_PATH_PRIORITIES[path];
    if (pathPriority !== undefined) {
      return pathPriority;
    }
  }
  return 0;
}
