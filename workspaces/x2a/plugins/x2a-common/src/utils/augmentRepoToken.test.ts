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

import { augmentRepoToken } from './augmentRepoToken';
import { AuthTokenDescriptor } from './tokenDescriptorTypes';

const makeDescriptor = (
  provider: string,
  overrides?: Partial<AuthTokenDescriptor>,
): AuthTokenDescriptor => ({
  provider,
  tokenType: 'oauth',
  scope: 'repo',
  ...overrides,
});

describe('augmentRepoToken', () => {
  it('prefixes gitlab tokens with oauth2:', () => {
    expect(augmentRepoToken('my-token', makeDescriptor('gitlab'))).toBe(
      'oauth2:my-token',
    );
  });

  it('prefixes bitbucket tokens with x-token-auth:', () => {
    expect(augmentRepoToken('my-token', makeDescriptor('bitbucket'))).toBe(
      'x-token-auth:my-token',
    );
  });

  it('returns github tokens unchanged', () => {
    expect(augmentRepoToken('my-token', makeDescriptor('github'))).toBe(
      'my-token',
    );
  });

  it('returns tokens for unknown providers unchanged', () => {
    expect(augmentRepoToken('my-token', makeDescriptor('gitea'))).toBe(
      'my-token',
    );
  });
});
