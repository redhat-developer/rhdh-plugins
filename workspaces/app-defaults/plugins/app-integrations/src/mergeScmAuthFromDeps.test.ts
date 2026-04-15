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

import type { ConfigApi } from '@backstage/core-plugin-api';
import { ScmAuth } from '@backstage/integration-react';

import { mergeScmAuthFromDeps } from './mergeScmAuthFromDeps';

describe('mergeScmAuthFromDeps', () => {
  const oauthStub = {} as Parameters<typeof ScmAuth.forGithub>[0];

  it('merges one ScmAuth per provider when integrations.* is unset', () => {
    const mergeSpy = jest
      .spyOn(ScmAuth, 'merge')
      .mockReturnValue({} as ReturnType<typeof ScmAuth.merge>);

    const configApi = {
      getOptionalConfigArray: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigApi;

    mergeScmAuthFromDeps({
      github: oauthStub,
      gitlab: oauthStub,
      azure: oauthStub,
      bitbucket: oauthStub,
      configApi,
    });

    expect(mergeSpy).toHaveBeenCalledTimes(1);
    expect(mergeSpy.mock.calls[0]).toHaveLength(4);
    mergeSpy.mockRestore();
  });

  it('adds one ScmAuth per integrations.github host entry', () => {
    const mergeSpy = jest
      .spyOn(ScmAuth, 'merge')
      .mockReturnValue({} as ReturnType<typeof ScmAuth.merge>);

    const configApi = {
      getOptionalConfigArray: jest.fn((key: string) => {
        if (key === 'integrations.github') {
          return [
            {
              getString: (k: string) =>
                k === 'host' ? 'github.example.com' : '',
            },
            {
              getString: (k: string) => (k === 'host' ? 'ghe.example.org' : ''),
            },
          ];
        }
        return undefined;
      }),
    } as unknown as ConfigApi;

    mergeScmAuthFromDeps({
      github: oauthStub,
      gitlab: oauthStub,
      azure: oauthStub,
      bitbucket: oauthStub,
      configApi,
    });

    // Two GitHub hosts + default singletons for gitlab, azure, bitbucket.
    expect(mergeSpy.mock.calls[0]).toHaveLength(5);
    mergeSpy.mockRestore();
  });
});
