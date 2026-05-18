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
  Project,
  resolveScmProvider,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Builds a URL to the repository at a specific branch.
 */
export const buildRepoBranchUrl = (
  url: string,
  branch: string,
  hostProviderMap?: Map<string, ScmProviderName>,
): string => {
  const baseUrl = url.endsWith('.git') ? url.slice(0, -4) : url;

  try {
    const parsed = new URL(baseUrl);
    const provider = resolveScmProvider(baseUrl, hostProviderMap);
    const path = parsed.pathname.replace(/\/$/, '');
    const encodedBranch = encodeURIComponent(branch);

    return provider.buildBranchUrl(parsed.origin, path, encodedBranch);
  } catch {
    return baseUrl;
  }
};

/**
 * Builds a URL to the project directory inside the target repository.
 */
export const buildProjectDirUrl = (
  project: Pick<Project, 'targetRepoUrl' | 'targetRepoBranch' | 'dirName'>,
  hostProviderMap?: Map<string, ScmProviderName>,
): string | undefined => {
  if (!project.dirName) return undefined;
  return `${buildRepoBranchUrl(project.targetRepoUrl, project.targetRepoBranch, hostProviderMap)}/${project.dirName}`;
};
