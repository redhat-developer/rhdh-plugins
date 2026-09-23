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
  createApiRef,
  discoveryApiRef,
  fetchApiRef,
  type ConfigApi,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';
import {
  dcmAuthApiFactory,
  dcmAuthApiRef,
  dcmOidcAuthApiFactory,
} from './api/AuthApiRefs';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from './apis';
import { dcmPlugin } from './plugin';

const oidcAuthApiRef = createApiRef<OAuthApi & OpenIdConnectApi>({
  id: 'internal.auth.oidc',
});

function expectDcmApisToResolve(resolver: ApiResolver) {
  expect(resolver.get(catalogApiRef)).toBeDefined();
  expect(resolver.get(policyManagerApiRef)).toBeDefined();
  expect(resolver.get(agentsApiRef)).toBeDefined();
  expect(resolver.get(resourcesApiRef)).toBeDefined();
}

function createDcmApiResolver(options: {
  authEnabled: boolean;
  oidcAuthApi?: OAuthApi & OpenIdConnectApi;
  useOidcAdapter?: boolean;
}) {
  const registry = new ApiFactoryRegistry();

  for (const factory of dcmPlugin.getApis()) {
    registry.register('default', factory);
  }
  registry.register(
    'default',
    createApiFactory(configApiRef, {
      getOptionalBoolean: jest.fn().mockReturnValue(options.authEnabled),
    } as unknown as ConfigApi),
  );
  registry.register(
    'default',
    createApiFactory(discoveryApiRef, {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost/api/dcm'),
    }),
  );
  const fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({}),
  });
  registry.register('default', createApiFactory(fetchApiRef, { fetch }));
  if (options.oidcAuthApi) {
    registry.register(
      'default',
      createApiFactory(oidcAuthApiRef, options.oidcAuthApi),
    );
  }
  if (options.useOidcAdapter) {
    registry.register('app', dcmOidcAuthApiFactory);
  }

  return { fetch, registry, resolver: new ApiResolver(registry) };
}

describe('dcm', () => {
  it('should export plugin', () => {
    expect(dcmPlugin).toBeDefined();
  });

  it('resolves all DCM APIs without an OIDC API when DCM auth is disabled', () => {
    const { resolver } = createDcmApiResolver({ authEnabled: false });

    expectDcmApisToResolve(resolver);
    expect(resolver.get(dcmAuthApiRef)?.getAccessToken).toBeUndefined();
  });

  it('does not select the host OIDC API when DCM auth is disabled', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('oidc-token');
    const oidcAuthApi = {
      getAccessToken,
      getIdToken: jest.fn(),
    } as unknown as OAuthApi & OpenIdConnectApi;
    const { fetch, resolver } = createDcmApiResolver({
      authEnabled: false,
      oidcAuthApi,
    });

    expectDcmApisToResolve(resolver);
    expect(resolver.get(dcmAuthApiRef)?.getAccessToken).toBeUndefined();
    await Promise.all([
      resolver.get(catalogApiRef)?.listServiceTypes(),
      resolver.get(policyManagerApiRef)?.listPolicies(),
      resolver.get(agentsApiRef)?.listAgents(),
      resolver.get(resourcesApiRef)?.listServiceTypeInstances(),
    ]);

    expect(getAccessToken).not.toHaveBeenCalled();
    for (const [, init] of fetch.mock.calls) {
      expect(init.headers).not.toHaveProperty('X-DCM-OIDC-Token');
    }
  });

  it('adapts the host OIDC access token for DCM auth-enabled clients', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('oidc-token');
    const oidcAuthApi = {
      getAccessToken,
      getIdToken: jest.fn(),
    } as unknown as OAuthApi & OpenIdConnectApi;
    const { fetch, resolver } = createDcmApiResolver({
      authEnabled: true,
      oidcAuthApi,
      useOidcAdapter: true,
    });

    expectDcmApisToResolve(resolver);
    await Promise.all([
      resolver.get(catalogApiRef)?.listServiceTypes(),
      resolver.get(policyManagerApiRef)?.listPolicies(),
      resolver.get(agentsApiRef)?.listAgents(),
      resolver.get(resourcesApiRef)?.listServiceTypeInstances(),
    ]);

    expect(getAccessToken).toHaveBeenCalledTimes(4);
    for (const [, init] of fetch.mock.calls) {
      expect(init.headers).toHaveProperty('X-DCM-OIDC-Token', 'oidc-token');
    }
  });

  it('fails explicitly when DCM auth is enabled without an OIDC adapter', async () => {
    const { resolver } = createDcmApiResolver({ authEnabled: true });

    const dcmAuthApi = resolver.get(dcmAuthApiRef);
    if (!dcmAuthApi?.getAccessToken) {
      throw new Error('Expected an actionable DCM OIDC auth API error');
    }

    await expect(dcmAuthApi.getAccessToken()).rejects.toThrow(
      'DCM authentication is enabled, but the host does not provide a DCM OIDC auth API factory.',
    );
  });

  it('lets the app-scoped DCM OIDC adapter override the config-only default', () => {
    const { registry } = createDcmApiResolver({
      authEnabled: true,
      oidcAuthApi: {
        getAccessToken: jest.fn(),
        getIdToken: jest.fn(),
      } as unknown as OAuthApi & OpenIdConnectApi,
      useOidcAdapter: true,
    });

    expect(registry.get(dcmAuthApiRef)).toBe(dcmOidcAuthApiFactory);
    expect(registry.get(oidcAuthApiRef)).not.toBe(dcmAuthApiFactory);
  });
});
