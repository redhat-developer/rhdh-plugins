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
 * See the License for the specific governing permissions and limitations under the License.
 */

import { AuthTokenDescriptor } from './tokenDescriptorTypes';

/**
 * Augments the repository token for the given provider.
 *
 * For GitLab, it adds a user preceding the token.
 * @public
 */
export const augmentRepoToken = (
  token: string,
  authDescriptor: AuthTokenDescriptor,
): string => {
  if (authDescriptor.provider === 'gitlab') {
    // The git push on gitlab requires an user name preceding the token.
    // https://docs.gitlab.com/api/oauth2/#access-git-over-https-with-access-token
    return `oauth2:${token}`;
  }
  return token;
};
