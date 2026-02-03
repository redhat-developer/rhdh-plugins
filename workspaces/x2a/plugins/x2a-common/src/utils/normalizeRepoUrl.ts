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
 * Converts URL provided by the Backstage's RepoUrlPicker component to the format expected by the x2a API.
 *
 * Example:
 * - Input: github.com?owner=someone&repo=myrepo
 * - Output: https://github.com/someone/myrepo.git
 *
 * Supports GitHub/GitLab-style (owner + repo)
 *
 * @param url - The repository URL to normalize (e.g. from RepoUrlPicker: host?owner=...&repo=...)
 * @returns Ready to clone git repo URL
 *
 * @public
 */
export function normalizeRepoUrl(url: string): string {
  if (!url?.trim()) {
    return url;
  }

  // Motivated by https://github.com/backstage/backstage/blob/master/plugins/scaffolder/src/components/fields/RepoUrlPicker/utils.ts
  try {
    const parsed = new URL(`https://${url.trim()}`);
    const host = parsed.host;
    const owner = parsed.searchParams.get('owner') ?? '';
    const repo = parsed.searchParams.get('repo') ?? '';

    // GitHub / GitLab style: host?owner=someone&repo=myrepo
    if (owner && repo) {
      return `https://${host}/${owner}/${repo}.git`;
    }
  } catch {
    // eslint-disable-next-line no-console
    console.error(`Unexpected git repo URL format: ${url}`);
  }

  // Not in RepoUrlPicker form; return as-is (e.g. already a full clone URL)
  return url;
}
