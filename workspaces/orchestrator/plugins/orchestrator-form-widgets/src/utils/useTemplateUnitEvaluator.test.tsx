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
import { useTemplateUnitEvaluator } from './useTemplateUnitEvaluator';
import { applySelectorString } from './applySelector';

jest.mock('./applySelector', () => ({
  applySelectorString: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api', () => {
  const refs = {
    configApiRef: { id: 'config' },
    identityApiRef: { id: 'identity' },
    githubAuthApiRef: { id: 'github' },
    atlassianAuthApiRef: { id: 'atlassian' },
    googleAuthApiRef: { id: 'google' },
    microsoftAuthApiRef: { id: 'microsoft' },
    gitlabAuthApiRef: { id: 'gitlab' },
  };

  return {
    ...refs,
    useApp: jest.fn(),
    useApiHolder: jest.fn(),
    useApi: jest.fn(),
  };
});

const corePluginApi = jest.requireMock('@backstage/core-plugin-api');
const mockedUseApi = corePluginApi.useApi as jest.Mock;
const mockedUseApp = corePluginApi.useApp as jest.Mock;
const mockedUseApiHolder = corePluginApi.useApiHolder as jest.Mock;
const mockedApplySelectorString = applySelectorString as jest.Mock;

describe('useTemplateUnitEvaluator', () => {
  const configApi = {
    getString: jest.fn(() => 'http://backend.local'),
    getOptionalString: jest.fn(() => 'from-config'),
  };

  const identityApi = {
    getCredentials: jest.fn(async () => ({ token: 'identity-token' })),
    getBackstageIdentity: jest.fn(async () => ({
      userEntityRef: 'user:default/dev',
    })),
    getProfileInfo: jest.fn(async () => ({
      email: 'dev@example.com',
      displayName: 'Dev User',
    })),
  };

  const oauthApi = {
    getAccessToken: jest.fn(async () => 'oauth-token'),
    getProfile: jest.fn(async () => ({
      email: 'oauth@example.com',
      displayName: 'OAuth User',
    })),
  };

  const openIdApi = {
    ...oauthApi,
    getIdToken: jest.fn(async () => 'openid-token'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseApp.mockReturnValue({
      getPlugins: () => [],
    });

    mockedUseApiHolder.mockReturnValue({
      get: jest.fn(),
      apis: new Map(),
    });

    mockedUseApi.mockImplementation((ref: { id: string }) => {
      switch (ref.id) {
        case 'config':
          return configApi;
        case 'identity':
          return identityApi;
        case 'github':
        case 'atlassian':
          return oauthApi;
        case 'google':
        case 'microsoft':
        case 'gitlab':
          return openIdApi;
        default:
          return {};
      }
    });
  });

  it('evaluates current.*, backend.*, and identityApi.* units', async () => {
    const { result } = renderHook(() => useTemplateUnitEvaluator());

    await expect(
      result.current('current.user.name', { user: { name: 'Ada' } } as any),
    ).resolves.toBe('Ada');
    await expect(result.current('backend.baseUrl', {} as any)).resolves.toBe(
      'http://backend.local',
    );
    await expect(result.current('identityApi.token', {} as any)).resolves.toBe(
      'identity-token',
    );
  });

  it('evaluates fetch response selector units', async () => {
    mockedApplySelectorString.mockResolvedValue('resolved-value');
    const { result } = renderHook(() => useTemplateUnitEvaluator());

    await expect(
      result.current(
        'fetch:response:value',
        {} as any,
        { data: [{ id: 'a' }] } as any,
        { 'fetch:response:value': '$.data[0].id' } as any,
      ),
    ).resolves.toBe('resolved-value');

    expect(mockedApplySelectorString).toHaveBeenCalledWith(
      { data: [{ id: 'a' }] },
      '$.data[0].id',
    );
  });

  it('errors when fetch response unit is requested without schema selector', async () => {
    const { result } = renderHook(() => useTemplateUnitEvaluator());

    await expect(
      result.current(
        'fetch:response:value',
        {} as any,
        { data: [] } as any,
        {} as any,
      ),
    ).rejects.toThrow("ui property 'fetch:response:value' does not exist");
  });

  it('errors for unknown custom auth provider api id', async () => {
    const { result } = renderHook(() => useTemplateUnitEvaluator());

    await expect(
      result.current('customAuthApi.my.custom.provider.token', {} as any),
    ).rejects.toThrow('Unknown custom auth provider API');
  });

  it('errors for unknown template units', async () => {
    const { result } = renderHook(() => useTemplateUnitEvaluator());

    await expect(result.current('mystery.unit', {} as any)).rejects.toThrow(
      'Unknown template unit',
    );
  });
});
