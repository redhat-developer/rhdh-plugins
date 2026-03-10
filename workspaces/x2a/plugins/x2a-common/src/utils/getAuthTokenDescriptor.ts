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
 * See the License for the specific governing permissions and limitations under the License.
 */
import { AuthTokenDescriptor } from './tokenDescriptorTypes';
import { getScmProvider } from './getScmProvider';

/**
 * Returns the AuthTokenDescriptor for the given repository URL.
 * Determines the provider.
 *
 * @public
 */
export const getAuthTokenDescriptor = ({
  repoUrl,
  readOnly,
}: {
  repoUrl: string;
  readOnly: boolean;
}): AuthTokenDescriptor => {
  const provider = getScmProvider(repoUrl);

  if (provider === 'github') {
    return {
      provider,
      tokenType: 'oauth',
      scope: 'repo',
    };
  }

  if (provider === 'bitbucket') {
    return {
      provider,
      tokenType: 'oauth',
      scope: readOnly ? 'repository' : 'repository:write',
    };
  }

  // GitLab (and unknown hosts that default to gitlab)
  return {
    provider,
    tokenType: 'oauth',
    scope: readOnly ? 'read_repository' : 'write_repository',
  };
};
