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

const mockIsAuthHost = jest.fn();
const mockAuthHostFor = jest.fn();
jest.mock('../hooks/useScmAuthHosts', () => ({
  useScmAuthHosts: () => ({
    isAuthHost: mockIsAuthHost,
    authHostFor: mockAuthHostFor,
  }),
}));

const mockGitlabAccessToken = jest.fn();
jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApiHolder: () => ({
      get: (ref: { id: string }) =>
        ref.id === actual.gitlabAuthApiRef.id
          ? { getAccessToken: mockGitlabAccessToken }
          : undefined,
    }),
  };
});

import { renderHook } from '@testing-library/react';
import { gitlabProvider } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  AuthHostNotAllowedError,
  repoTokenRequest,
  useRepoAuthentication,
} from './useRepoAuth';

const descriptor = gitlabProvider.getAuthTokenDescriptor(false);

describe('useRepoAuthentication host guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthHostFor.mockReturnValue('gitlab.corp.example.com');
    mockGitlabAccessToken.mockResolvedValue('glpat-secret');
  });

  it('returns the token for the host the provider is registered against', async () => {
    mockIsAuthHost.mockReturnValue(true);
    const { result } = renderHook(() => useRepoAuthentication());

    await expect(
      result.current.getRawToken(descriptor, 'gitlab.corp.example.com'),
    ).resolves.toBe('glpat-secret');
    expect(mockIsAuthHost).toHaveBeenCalledWith(
      'gitlab.corp.example.com',
      'gitlab',
    );
  });

  it('never calls the OAuth API for another host', async () => {
    mockIsAuthHost.mockReturnValue(false);
    const { result } = renderHook(() => useRepoAuthentication());

    await expect(
      result.current.getRawToken(descriptor, 'gitlab.other.example.com'),
    ).rejects.toThrow(
      'configured for gitlab.corp.example.com, not gitlab.other.example.com',
    );
    await expect(
      result.current.getRawToken(descriptor, 'gitlab.other.example.com'),
    ).rejects.toBeInstanceOf(AuthHostNotAllowedError);
    expect(mockGitlabAccessToken).not.toHaveBeenCalled();
  });

  it('names the missing config key when no host is configured', async () => {
    mockIsAuthHost.mockReturnValue(false);
    mockAuthHostFor.mockReturnValue(undefined);
    const { result } = renderHook(() => useRepoAuthentication());

    await expect(
      result.current.getRawToken(descriptor, 'gitlab.corp.example.com'),
    ).rejects.toThrow('x2a.scm.authHosts.gitlab');
    expect(mockGitlabAccessToken).not.toHaveBeenCalled();
  });

  it('authenticate applies the same guard and the provider token prefix', async () => {
    mockIsAuthHost.mockImplementation(
      (host: string) => host === 'gitlab.corp.example.com',
    );
    const { result } = renderHook(() => useRepoAuthentication());

    await expect(
      result.current.authenticate([
        { descriptor, host: 'gitlab.corp.example.com' },
      ]),
    ).resolves.toEqual([{ token: 'oauth2:glpat-secret', provider: 'gitlab' }]);

    await expect(
      result.current.authenticate([
        { descriptor, host: 'gitlab.corp.example.com' },
        { descriptor, host: 'gitlab.other.example.com' },
      ]),
    ).rejects.toThrow('not gitlab.other.example.com');
  });

  it('authenticate refuses the whole batch before any OAuth flow starts', async () => {
    mockIsAuthHost.mockImplementation(
      (host: string) => host === 'gitlab.corp.example.com',
    );
    const { result } = renderHook(() => useRepoAuthentication());

    // The allowed host comes first, as in a CSV row whose target host is
    // allowed and whose source host is not.
    await expect(
      result.current.authenticate([
        { descriptor, host: 'gitlab.corp.example.com' },
        { descriptor, host: 'gitlab.other.example.com' },
      ]),
    ).rejects.toBeInstanceOf(AuthHostNotAllowedError);
    expect(mockGitlabAccessToken).not.toHaveBeenCalled();
  });
});

describe('repoTokenRequest', () => {
  it('binds the owning provider descriptor to the repository host', () => {
    expect(
      repoTokenRequest(
        'https://gitlab.corp.example.com:8443/org/repo',
        new Map([['gitlab.corp.example.com:8443', 'gitlab']]),
        true,
      ),
    ).toEqual({
      descriptor: gitlabProvider.getAuthTokenDescriptor(true),
      host: 'gitlab.corp.example.com:8443',
    });
  });
});
