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
 * Origin and path of a repository URL.
 *
 * @public
 */
export type ParsedRepoUrl = {
  /** Scheme and host (including a non-default port), e.g. `https://github.com`. */
  origin: string;
  /** Repository path without a trailing slash or `.git` suffix, e.g. `/owner/repo`. */
  path: string;
};

/**
 * Splits a repository URL into its origin and path.
 * The `.git` suffix and a trailing slash are removed.
 *
 * @throws TypeError when the URL cannot be parsed
 *
 * @public
 */
export function parseRepoUrl(repoUrl: string): ParsedRepoUrl {
  const withoutSuffix = repoUrl.endsWith('.git')
    ? repoUrl.slice(0, -4)
    : repoUrl;
  const parsed = new URL(withoutSuffix);
  return {
    origin: parsed.origin,
    path: parsed.pathname.replace(/\/$/, ''),
  };
}
