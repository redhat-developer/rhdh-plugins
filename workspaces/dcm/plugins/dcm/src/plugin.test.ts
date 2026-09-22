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
  createApiFactory,
  createApiRef,
  discoveryApiRef,
  fetchApiRef,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';
import {
  dcmAuthApiRef,
  dcmAuthDisabledApiFactory,
  dcmOidcAuthApiFactory,
} from './api/AuthApiRefs';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from './apis';
import { dcmPlugin } from './plugin';

function expectDcmApisToResolve(resolver: ApiResolver) {
  expect(resolver.get(catalogApiRef)).toBeDefined();
  expect(resolver.get(policyManagerApiRef)).toBeDefined();
  expect(resolver.get(agentsApiRef)).toBeDefined();
  expect(resolver.get(resourcesApiRef)).toBeDefined();
}

const oidcAuthApiRef = createApiRef<OAuthApi & OpenIdConnectApi>({
  id: 'internal.auth.oidc',
});

function createDcmApiResolver(
  authApiFactory: typeof dcmAuthDisabledApiFactory,
) {
  const registry = new ApiFactoryRegistry();

  for (const factory of dcmPlugin.getApis()) {
    registry.register('default', factory);
  }
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
  registry.register('app', authApiFactory);

  return new ApiResolver(registry);
}

describe('dcm', () => {
  it('should export plugin', () => {
    expect(dcmPlugin).toBeDefined();
  });

  it('resolves DCM APIs with a DCM-specific auth-disabled factory', () => {
    const resolver = createDcmApiResolver(dcmAuthDisabledApiFactory);

    expectDcmApisToResolve(resolver);
    expect(resolver.get(dcmAuthApiRef)?.getAccessToken).toBeUndefined();
  });

  it('keeps the host OIDC API separate from the auth-disabled DCM factory', () => {
    const registry = new ApiFactoryRegistry();
    const oidcAuthApi = {
      getAccessToken: jest.fn(),
      getIdToken: jest.fn(),
    } as unknown as OAuthApi & OpenIdConnectApi;

    registry.register('default', createApiFactory(oidcAuthApiRef, oidcAuthApi));
    registry.register('default', dcmOidcAuthApiFactory);
    registry.register('app', dcmAuthDisabledApiFactory);

    expect(registry.get(oidcAuthApiRef)?.factory({})).toBe(oidcAuthApi);
    expect(registry.get(dcmAuthApiRef)).toBe(dcmAuthDisabledApiFactory);
  });

  it('adapts the host OIDC access token for DCM auth-enabled clients', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('oidc-token');
    const oidcAuthApi = {
      getAccessToken,
      getIdToken: jest.fn(),
    } as unknown as OAuthApi & OpenIdConnectApi;
    const registry = new ApiFactoryRegistry();

    for (const factory of dcmPlugin.getApis()) {
      registry.register('default', factory);
    }
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
    registry.register('default', createApiFactory(oidcAuthApiRef, oidcAuthApi));

    const resolver = new ApiResolver(registry);

    expectDcmApisToResolve(resolver);

    const dcmAuthApi = resolver.get(dcmAuthApiRef);
    if (!dcmAuthApi?.getAccessToken) {
      throw new Error(
        'Expected the DCM OIDC auth API to provide an access token',
      );
    }
    await expect(dcmAuthApi.getAccessToken()).resolves.toBe('oidc-token');
    expect(getAccessToken).toHaveBeenCalledTimes(1);
  });
});
