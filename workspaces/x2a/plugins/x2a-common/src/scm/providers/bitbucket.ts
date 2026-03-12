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
import { extractHostname } from '../extractHostname';

/**
 * Bitbucket Cloud SCM provider.
 *
 * Cloud-only (bitbucket.org). Self-hosted Bitbucket Server uses different
 * URL patterns and will fall through to the GitLab fallback provider.
 *
 * @public
 */
export const bitbucketProvider: ScmProvider = {
  name: 'bitbucket',

  matches: (url: string) => extractHostname(url) === 'bitbucket.org',

  getAuthTokenDescriptor: (readOnly: boolean) => ({
    provider: 'bitbucket',
    tokenType: 'oauth' as const,
    scope: readOnly ? 'repository' : 'repository:write',
  }),

  augmentToken: (token: string) => `x-token-auth:${token}`,

  // Heads-up when adding the Bitbucket server in the future: it probably uses ".../branches/..." instead of "../branch/..."
  buildBranchUrl: (origin, path, encodedBranch) =>
    `${origin}${path}/branch/${encodedBranch}`,

  buildArtifactUrl: (origin, path, encodedBranch, filePath) =>
    `${origin}${path}/src/${encodedBranch}/${filePath}`,
};
