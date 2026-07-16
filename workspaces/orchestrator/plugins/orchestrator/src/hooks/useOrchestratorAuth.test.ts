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

import { renderHook } from '@testing-library/react';

import { useOrchestratorAuth } from './useOrchestratorAuth';

const mockUseApi = jest.fn();
const mockUseApiHolder = jest.fn();
const mockUseApp = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  githubAuthApiRef: { id: 'core.auth.github' },
  gitlabAuthApiRef: { id: 'core.auth.gitlab' },
  microsoftAuthApiRef: { id: 'core.auth.microsoft' },
  useApi: (...args: unknown[]) => mockUseApi(...args),
  useApiHolder: (...args: unknown[]) => mockUseApiHolder(...args),
  useApp: (...args: unknown[]) => mockUseApp(...args),
}));

describe('useOrchestratorAuth', () => {
  const githubAuthApi = {
    getAccessToken: jest.fn(),
    getIdToken: jest.fn(),
  };
  const gitlabAuthApi = {
    getAccessToken: jest.fn(),
  };
  const microsoftAuthApi = {
    getAccessToken: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const builtInApiMap: Record<string, unknown> = {
      'core.auth.github': githubAuthApi,
      'core.auth.gitlab': gitlabAuthApi,
      'core.auth.microsoft': microsoftAuthApi,
    };
    mockUseApi.mockImplementation(
      (ref: { id: string }) => builtInApiMap[ref.id],
    );
    mockUseApp.mockReturnValue({
      getPlugins: () => [],
    });
    mockUseApiHolder.mockReturnValue({
      get: jest.fn(),
      apis: new Map(),
    });
  });

  it('authenticates with built-in oauth providers', async () => {
    githubAuthApi.getAccessToken.mockResolvedValue('gh-token');
    gitlabAuthApi.getAccessToken.mockResolvedValue('gl-token');
    microsoftAuthApi.getAccessToken.mockResolvedValue('ms-token');

    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        { provider: 'GitHub', scope: ['repo'] },
        { provider: 'gitlab', tokenType: 'oauth', scope: ['read_api'] },
        { provider: 'Microsoft', scope: ['User.Read'] },
      ]),
    ).resolves.toEqual([
      { provider: 'GitHub', token: 'gh-token' },
      { provider: 'gitlab', token: 'gl-token' },
      { provider: 'Microsoft', token: 'ms-token' },
    ]);

    expect(githubAuthApi.getAccessToken).toHaveBeenCalledWith(['repo']);
    expect(gitlabAuthApi.getAccessToken).toHaveBeenCalledWith(['read_api']);
    expect(microsoftAuthApi.getAccessToken).toHaveBeenCalledWith(['User.Read']);
  });

  it('authenticates with openId token type', async () => {
    githubAuthApi.getIdToken.mockResolvedValue('oidc-token');

    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        { provider: 'github', tokenType: 'openId' },
      ]),
    ).resolves.toEqual([{ provider: 'github', token: 'oidc-token' }]);
  });

  it('throws when openId is requested from a non-OIDC API', async () => {
    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        { provider: 'gitlab', tokenType: 'openId' },
      ]),
    ).rejects.toThrow(
      'gitlab auth API does not support OpenID Connect tokens, since it does not implement the getIdToken method',
    );
  });

  it('throws for unsupported token types', async () => {
    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        { provider: 'github', tokenType: 'unknown' as never },
      ]),
    ).rejects.toThrow(
      'Unsupported token type: unknown. The supported token types are: openId and oauth',
    );
  });

  it('throws when custom provider API id is missing', async () => {
    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([{ provider: 'oidc' }]),
    ).rejects.toThrow(
      'Custom authentication provider API id is required for provider: oidc',
    );
  });

  it('resolves custom provider APIs from plugin factories', async () => {
    const customApi = {
      getAccessToken: jest.fn().mockResolvedValue('custom-token'),
    };
    const customApiRef = { id: 'custom.auth.oidc' };
    const apiHolderGet = jest.fn().mockReturnValue(customApi);

    mockUseApp.mockReturnValue({
      getPlugins: () => [
        {
          getApis: () => [{ api: customApiRef }],
        },
      ],
    });
    mockUseApiHolder.mockReturnValue({
      get: apiHolderGet,
      apis: new Map(),
    });

    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        {
          provider: 'oidc',
          customProviderApiId: 'custom.auth.oidc',
          scope: ['openid'],
        },
      ]),
    ).resolves.toEqual([{ provider: 'oidc', token: 'custom-token' }]);

    expect(apiHolderGet).toHaveBeenCalledWith(customApiRef);
    expect(customApi.getAccessToken).toHaveBeenCalledWith(['openid']);
  });

  it('falls back to static API holder map for custom providers', async () => {
    const customApi = {
      getAccessToken: jest.fn().mockResolvedValue('static-token'),
    };

    mockUseApp.mockReturnValue({
      getPlugins: () => [],
    });
    mockUseApiHolder.mockReturnValue({
      get: jest.fn(),
      apis: new Map([['internal.auth.oidc', customApi]]),
    });

    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        {
          provider: 'oidc',
          customProviderApiId: 'internal.auth.oidc',
        },
      ]),
    ).resolves.toEqual([{ provider: 'oidc', token: 'static-token' }]);
  });

  it('throws when custom provider API cannot be found', async () => {
    mockUseApp.mockReturnValue({
      getPlugins: () => [],
    });
    mockUseApiHolder.mockReturnValue({
      get: jest.fn(),
      apis: new Map(),
    });

    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        {
          provider: 'oidc',
          customProviderApiId: 'missing.auth',
        },
      ]),
    ).rejects.toThrow(
      'API with id "missing.auth" was not found in the API holder.',
    );
  });

  it('throws when plugin-provided custom API is missing from holder', async () => {
    const customApiRef = { id: 'custom.auth.missing' };

    mockUseApp.mockReturnValue({
      getPlugins: () => [
        {
          getApis: () => [{ api: customApiRef }],
        },
      ],
    });
    mockUseApiHolder.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
      apis: new Map(),
    });

    const { result } = renderHook(() => useOrchestratorAuth());

    await expect(
      result.current.authenticate([
        {
          provider: 'oidc',
          customProviderApiId: 'custom.auth.missing',
        },
      ]),
    ).rejects.toThrow(
      'API with id "custom.auth.missing" was not found in the API holder. The API is provided by a plugin.',
    );
  });
});
