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

import { ScmProvider } from '../ScmProvider';

/**
 * GitLab SCM provider.
 *
 * Also used as the fallback for unknown/self-hosted SCM hosts
 * (includes Bitbucket Server deployments).
 *
 * @public
 */
export const gitlabProvider: ScmProvider = {
  name: 'gitlab',

  // gitlab is the fallback provider; URL matching for gitlab.com is not
  // strictly required because the registry falls through to this provider,
  // but we still match it explicitly for clarity.
  matches: (_url: string) => false,

  getAuthTokenDescriptor: (readOnly: boolean) => ({
    provider: 'gitlab',
    tokenType: 'oauth' as const,
    scope: readOnly ? 'read_repository' : 'write_repository',
  }),

  augmentToken: (token: string) => `oauth2:${token}`,

  buildBranchUrl: (origin, path, encodedBranch) =>
    `${origin}${path}/-/tree/${encodedBranch}`,

  buildArtifactUrl: (origin, path, encodedBranch, filePath) =>
    `${origin}${path}/-/blob/${encodedBranch}/${filePath}`,
};
