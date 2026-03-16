/**
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

import {
  resolveScmProvider,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Builds a URL to a specific file (artifact) in a repository at a given branch.
 */
export const buildArtifactUrl = (
  value: string,
  targetRepoUrl: string,
  targetRepoBranch: string,
  hostProviderMap?: Map<string, ScmProviderName>,
): string => {
  const baseUrl = targetRepoUrl.endsWith('.git')
    ? targetRepoUrl.slice(0, -4)
    : targetRepoUrl;

  try {
    const parsed = new URL(baseUrl);
    const provider = resolveScmProvider(baseUrl, hostProviderMap);
    const path = parsed.pathname.replace(/\/$/, '');
    const encodedBranch = encodeURIComponent(targetRepoBranch);

    return provider.buildArtifactUrl(parsed.origin, path, encodedBranch, value);
  } catch {
    return `${baseUrl}/blob/${targetRepoBranch}/${value}`;
  }
};
