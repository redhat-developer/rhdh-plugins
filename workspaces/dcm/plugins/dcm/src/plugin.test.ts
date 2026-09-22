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
import { ApiFactoryRegistry, ApiResolver } from '@backstage/core-app-api';
import {
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  type ConfigApi,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';
import {
  dcmAuthDisabledOidcApiFactory,
  oidcAuthApiRef,
} from './api/AuthApiRefs';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from './apis';
import { dcmPlugin, getDcmAccessTokenProvider } from './plugin';

describe('dcm', () => {
  it('should export plugin', () => {
    expect(dcmPlugin).toBeDefined();
  });

  it('creates a bound OIDC token provider when authentication is enabled', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('oidc-token');
    const configApi = {
      getOptionalBoolean: jest.fn().mockReturnValue(true),
    } as unknown as ConfigApi;
    const oidcAuthApi = {
      getAccessToken,
    } as unknown as OAuthApi & OpenIdConnectApi;

    const getDcmAccessToken = getDcmAccessTokenProvider(configApi, oidcAuthApi);

    await expect(getDcmAccessToken?.()).resolves.toBe('oidc-token');
    expect(getAccessToken).toHaveBeenCalledTimes(1);
  });

  it('does not create a token provider when authentication is disabled', () => {
    const configApi = {
      getOptionalBoolean: jest.fn().mockReturnValue(false),
    } as unknown as ConfigApi;
    const oidcAuthApi = {
      getAccessToken: jest.fn(),
    } as unknown as OAuthApi & OpenIdConnectApi;

    expect(getDcmAccessTokenProvider(configApi, oidcAuthApi)).toBeUndefined();
  });

  it('reports a missing OIDC API when authentication is enabled', async () => {
    const configApi = {
      getOptionalBoolean: jest.fn().mockReturnValue(true),
    } as unknown as ConfigApi;

    await expect(getDcmAccessTokenProvider(configApi)?.()).rejects.toThrow(
      'DCM authentication is enabled, but the host does not provide internal.auth.oidc.',
    );
  });

  it('resolves DCM APIs with the auth-disabled OIDC fallback', () => {
    const registry = new ApiFactoryRegistry();
    const configApi = {
      getOptionalBoolean: jest.fn().mockReturnValue(false),
    } as unknown as ConfigApi;

    for (const factory of dcmPlugin.getApis()) {
      registry.register('default', factory);
    }
    registry.register('default', createApiFactory(configApiRef, configApi));
    registry.register(
      'default',
      createApiFactory(discoveryApiRef, {
        getBaseUrl: jest.fn().mockResolvedValue('http://localhost/api/dcm'),
      }),
    );
    registry.register(
      'default',
      createApiFactory(fetchApiRef, { fetch: jest.fn() }),
    );
    registry.register('default', dcmAuthDisabledOidcApiFactory);

    const resolver = new ApiResolver(registry);

    expect(resolver.get(catalogApiRef)).toBeDefined();
    expect(resolver.get(policyManagerApiRef)).toBeDefined();
    expect(resolver.get(agentsApiRef)).toBeDefined();
    expect(resolver.get(resourcesApiRef)).toBeDefined();
    expect(registry.get(oidcAuthApiRef)).toBe(dcmAuthDisabledOidcApiFactory);
  });
});
