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

export function parseQueryGitUrl(repoUrl: string): {
  baseUrl: string;
  owner: string;
  repo: string;
} {
  const fakeUrl = `https://${repoUrl}`;
  const url = new URL(fakeUrl);

  const queries = new URLSearchParams(url.searchParams);
  const owner = queries.get('owner');
  const repo = queries.get('repo');

  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub query‑string URL: ${url}. Expected "owner" and "repo" query parameters.`,
    );
  }

  return { owner, repo, baseUrl: url.host };
}
