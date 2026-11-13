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

import { Codespace, GitRepositoryRef } from '../../domain';
import { ScmProvider } from '../ScmProvider';
import { extractHost } from '../extractHost';

/**
 * GitHub SCM provider.
 *
 * Matches cloud GitHub (github.com) only.
 * GitHub Enterprise on custom domains requires config-based detection
 * via the `integrations:` section.
 *
 * @public
 */
export const githubProvider: ScmProvider = {
  name: 'github',

  matches: (url: string) => extractHost(url) === 'github.com',

  getAuthTokenDescriptor: (_readOnly: boolean) => ({
    provider: 'github',
    tokenType: 'oauth' as const,
    scope: 'repo',
  }),

  augmentToken: (token: string) => token,

  buildBranchUrl: (origin, path, encodedBranch) =>
    `${origin}${path}/tree/${encodedBranch}`,

  buildArtifactUrl: (origin, path, encodedBranch, filePath) =>
    `${origin}${path}/blob/${encodedBranch}/${filePath}`,

  buildCodespace: (repository: GitRepositoryRef, devcontainerPath: string) => {
    const repositoryUrl = repository.url.endsWith('.git')
      ? repository.url.slice(0, -4)
      : repository.url;

    try {
      const pathSegments = new URL(repositoryUrl).pathname
        .split('/')
        .filter(Boolean);
      if (pathSegments.length < 2) {
        return undefined;
      }
      const path = `/${pathSegments.join('/')}`;

      const params = new URLSearchParams({
        ref: repository.branch,
        devcontainer_path: devcontainerPath,
      });
      return new Codespace(
        `https://codespaces.new${path}?${params.toString()}`,
      );
    } catch {
      return undefined;
    }
  },
};
