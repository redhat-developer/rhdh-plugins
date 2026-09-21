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
 * Regex for valid semver (major.minor.patch with optional pre-release).
 *
 * @internal
 */
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\w][\w.]*)?)?$/;

/**
 * Compact date format: YYYYMMDD (8 digits).
 *
 * @internal
 */
const DATE_COMPACT_RE = /^\d{8}$/;

/**
 * Dash-separated date format: YYYY-MM-DD.
 *
 * @internal
 */
const DATE_DASH_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Short Git commit SHA (7–12 lowercase hex characters).
 *
 * @internal
 */
const COMMIT_HASH_RE = /^[0-9a-f]{7,12}$/;

/**
 * Normalize an AI asset version string to semver-compatible format.
 *
 * Rules (applied in order):
 * 1. **Semver pass-through** — valid semver strings (e.g. `1.2.3`,
 *    `2.0.0-beta.1`) are returned unchanged.
 * 2. **Date-based** — `YYYYMMDD` or `YYYY-MM-DD` is normalized to
 *    `0.0.0-YYYYMMDD` (compact form, dashes removed).
 * 3. **Commit hash** — 7–12 character lowercase hex is normalized to
 *    `0.0.0-<hash>`.
 * 4. **Fallback** — anything else becomes `0.0.0-unknown` and a
 *    warning is logged via the optional `warn` callback.
 *
 * @param sourceVersion - The raw version string from the source registry.
 * @param options - Optional configuration: `entityRef` for log context,
 *   `warn` callback (defaults to `console.warn`).
 * @returns A semver-compatible version string.
 *
 * @public
 */
export function normalizeAIAssetVersion(
  sourceVersion: string,
  options?: {
    entityRef?: string;
    warn?: (message: string) => void;
  },
): string {
  const version = sourceVersion.trim();

  // Rule 1: semver pass-through
  if (SEMVER_RE.test(version)) {
    return version;
  }

  // Rule 2: date-based normalization
  if (DATE_COMPACT_RE.test(version)) {
    return `0.0.0-${version}`;
  }
  if (DATE_DASH_RE.test(version)) {
    return `0.0.0-${version.replace(/-/g, '')}`;
  }

  // Rule 3: commit hash normalization
  if (COMMIT_HASH_RE.test(version)) {
    return `0.0.0-${version}`;
  }

  // Rule 4: fallback
  const warn = options?.warn ?? console.warn;
  const entityCtx = options?.entityRef
    ? ` for entity ${options.entityRef}`
    : '';
  warn(
    `Unrecognized version format '${sourceVersion}'${entityCtx}. Normalized to 0.0.0-unknown`,
  );
  return '0.0.0-unknown';
}
