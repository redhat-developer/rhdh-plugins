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

import { AuthTokenDescriptor } from '../utils/tokenDescriptorTypes';

/**
 * Supported SCM provider names.
 * @public
 */
export type ScmProviderName = 'github' | 'gitlab' | 'bitbucket';

/**
 * Interface describing SCM-provider-specific behaviors.
 *
 * Each supported SCM host (GitHub, GitLab, Bitbucket) implements this
 * interface so that provider-specific logic lives in one place.
 *
 * @public
 */
export interface ScmProvider {
  readonly name: ScmProviderName;

  /** Returns true when this provider owns the given repository URL. */
  matches(repoUrl: string): boolean;

  /** OAuth token descriptor for the requested access level. */
  getAuthTokenDescriptor(readOnly: boolean): AuthTokenDescriptor;

  /**
   * Provider-specific token format for git-over-HTTPS.
   * E.g. GitLab requires `oauth2:<token>`, Bitbucket requires `x-token-auth:<token>`.
   */
  augmentToken(token: string): string;

  /** URL to view a branch in the SCM web UI. */
  buildBranchUrl(origin: string, path: string, encodedBranch: string): string;

  /** URL to view a file (artifact) at a branch in the SCM web UI. */
  buildArtifactUrl(
    origin: string,
    path: string,
    encodedBranch: string,
    filePath: string,
  ): string;
}
