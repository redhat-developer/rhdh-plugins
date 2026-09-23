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

import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import {
  configApiRef,
  createApiRef,
  discoveryApiRef,
  fetchApiRef,
  type ApiRef,
  type ConfigApi,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from '../apis';
import { dcmAuthApiRef, type DcmAuthApi } from './AuthApiRefs';
import { DcmClientsProvider, useDcmClients } from './DcmClientsContext';

const oidcAuthApiRef = createApiRef<OAuthApi & OpenIdConnectApi>({
  id: 'internal.auth.oidc',
});

type ClientName =
  | 'agentsApi'
  | 'catalogApi'
  | 'policyManagerApi'
  | 'resourcesApi';

type DcmClients = ReturnType<typeof useDcmClients>;

const clientRequests: Record<ClientName, (clients: DcmClients) => void> = {
  agentsApi: clients => void clients.agentsApi.listAgents(),
  catalogApi: clients => void clients.catalogApi.listServiceTypes(),
  policyManagerApi: clients => void clients.policyManagerApi.listPolicies(),
  resourcesApi: clients => void clients.resourcesApi.listServiceTypeInstances(),
};

function RequestClients({ clients }: { clients: ClientName[] }) {
  const dcmClients = useDcmClients();

  useEffect(() => {
    for (const client of clients) {
      clientRequests[client](dcmClients);
    }
  }, [clients, dcmClients]);
  return null;
}

function renderProvider(options: {
  authEnabled: boolean;
  clients?: ClientName[];
  hostApis?: Array<[ApiRef<unknown>, Partial<unknown>]>;
  oidcAuthApi?: OAuthApi & OpenIdConnectApi;
}) {
  const fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ results: [] }),
  });
  const apis = [
    [
      configApiRef,
      {
        getOptionalBoolean: jest.fn().mockReturnValue(options.authEnabled),
      } as unknown as ConfigApi,
    ],
    [discoveryApiRef, { getBaseUrl: jest.fn().mockResolvedValue('/api/dcm') }],
    [fetchApiRef, { fetch }],
  ] as unknown as Array<[ApiRef<unknown>, Partial<unknown>]>;
  if (options.oidcAuthApi) {
    apis.push([oidcAuthApiRef, options.oidcAuthApi]);
  }
  apis.push(...(options.hostApis ?? []));

  return {
    fetch,
    render: () =>
      render(
        <TestApiProvider apis={apis}>
          <DcmClientsProvider>
            <RequestClients clients={options.clients ?? ['catalogApi']} />
          </DcmClientsProvider>
        </TestApiProvider>,
      ),
  };
}

describe('DcmClientsProvider', () => {
  it('forwards the host OIDC token through the DCM backend proxy', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('oidc-token');
    const { fetch, render: renderProviderWithAuth } = renderProvider({
      authEnabled: true,
      oidcAuthApi: {
        getAccessToken,
        getIdToken: jest.fn(),
      } as unknown as OAuthApi & OpenIdConnectApi,
    });

    renderProviderWithAuth();

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(getAccessToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/dcm/proxy/service-types',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-DCM-OIDC-Token': 'oidc-token',
        }),
      }),
    );
  });

  it.each([
    ['agentsApi', agentsApiRef, 'listAgents', 'catalogApi'],
    ['catalogApi', catalogApiRef, 'listServiceTypes', 'agentsApi'],
    ['policyManagerApi', policyManagerApiRef, 'listPolicies', 'catalogApi'],
    ['resourcesApi', resourcesApiRef, 'listServiceTypeInstances', 'catalogApi'],
  ] as const)(
    'preserves a custom %s override during OIDC fallback',
    async (client, apiRef, method, fallbackClient) => {
      const customRequest = jest.fn().mockResolvedValue({ results: [] });
      const customApi = { [method]: customRequest };
      const getAccessToken = jest.fn().mockResolvedValue('oidc-token');
      const { fetch, render: renderProviderWithOverride } = renderProvider({
        authEnabled: true,
        clients: [client, fallbackClient],
        hostApis: [[apiRef, customApi]] as unknown as Array<
          [ApiRef<unknown>, Partial<unknown>]
        >,
        oidcAuthApi: {
          getAccessToken,
          getIdToken: jest.fn(),
        } as unknown as OAuthApi & OpenIdConnectApi,
      });

      renderProviderWithOverride();

      await waitFor(() => expect(customRequest).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      expect(getAccessToken).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-DCM-OIDC-Token': 'oidc-token',
          }),
        }),
      );
    },
  );

  it('uses host DCM clients without requiring OIDC when DCM auth is disabled', async () => {
    const catalogApi = { listServiceTypes: jest.fn().mockResolvedValue({}) };
    const { fetch, render: renderProviderWithoutAuth } = renderProvider({
      authEnabled: false,
      hostApis: [
        [agentsApiRef, {}],
        [catalogApiRef, catalogApi],
        [policyManagerApiRef, {}],
        [resourcesApiRef, {}],
      ] as Array<[ApiRef<unknown>, Partial<unknown>]>,
    });

    renderProviderWithoutAuth();

    await waitFor(() => expect(catalogApi.listServiceTypes).toHaveBeenCalled());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses host DCM client overrides when a custom auth API is registered', async () => {
    const catalogApi = { listServiceTypes: jest.fn().mockResolvedValue({}) };
    const dcmAuthApi: DcmAuthApi = {
      getAccessToken: jest.fn().mockResolvedValue('custom-token'),
    };
    const { fetch, render: renderProviderWithCustomAuth } = renderProvider({
      authEnabled: true,
      hostApis: [
        [dcmAuthApiRef, dcmAuthApi],
        [agentsApiRef, {}],
        [catalogApiRef, catalogApi],
        [policyManagerApiRef, {}],
        [resourcesApiRef, {}],
      ] as Array<[ApiRef<unknown>, Partial<unknown>]>,
    });

    renderProviderWithCustomAuth();

    await waitFor(() => expect(catalogApi.listServiceTypes).toHaveBeenCalled());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails with an actionable error when the host OIDC API is unavailable', () => {
    const { render: renderProviderWithoutOidc } = renderProvider({
      authEnabled: true,
    });

    expect(renderProviderWithoutOidc).toThrow(
      'DCM authentication is enabled, but the host does not provide a usable OIDC API at internal.auth.oidc.',
    );
  });
});
