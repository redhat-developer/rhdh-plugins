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

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  configApiRef,
  createApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
  useApiHolder,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from '../apis';
import { dcmAuthApiRef, isDefaultDcmAuthApi } from './AuthApiRefs';
import { isDefaultDcmClient } from './DefaultDcmClient';
import {
  AgentsClient,
  CatalogClient,
  PolicyManagerClient,
  ResourcesClient,
  type AgentsApi,
  type CatalogApi,
  type DcmOidcTokenProvider,
  type PolicyManagerApi,
  type ResourcesApi,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';

type DcmClients = {
  agentsApi: AgentsApi;
  catalogApi: CatalogApi;
  policyManagerApi: PolicyManagerApi;
  resourcesApi: ResourcesApi;
};

type DcmClientsTestDoubles = Partial<{
  [K in keyof DcmClients]: Partial<DcmClients[K]>;
}>;

const oidcAuthApiRef = createApiRef<OAuthApi & OpenIdConnectApi>({
  id: 'internal.auth.oidc',
});

const DcmClientsContext = createContext<DcmClients | undefined>(undefined);

function getAccessTokenProvider(
  authEnabled: boolean,
  oidcAuthApi: (OAuthApi & OpenIdConnectApi) | undefined,
): DcmOidcTokenProvider | undefined {
  if (!authEnabled) {
    return undefined;
  }

  if (!oidcAuthApi || typeof oidcAuthApi.getAccessToken !== 'function') {
    throw new Error(
      'DCM authentication is enabled, but the host does not provide a usable OIDC API at internal.auth.oidc.',
    );
  }

  return oidcAuthApi.getAccessToken.bind(oidcAuthApi);
}

/** Provides DCM clients resolved from the host APIs at the route boundary. */
export function DcmClientsProvider({ children }: { children: ReactNode }) {
  const configApi = useApi(configApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const apiHolder = useApiHolder();
  const authEnabled = configApi.getOptionalBoolean('dcm.auth.enabled') ?? true;
  const dcmAuthApi = apiHolder.get(dcmAuthApiRef);
  const useOidcFallback =
    authEnabled && (!dcmAuthApi || isDefaultDcmAuthApi(dcmAuthApi));
  const oidcAuthApi = useOidcFallback
    ? apiHolder.get(oidcAuthApiRef)
    : undefined;

  const clients = useMemo(() => {
    const agentsApi = apiHolder.get(agentsApiRef);
    const catalogApi = apiHolder.get(catalogApiRef);
    const policyManagerApi = apiHolder.get(policyManagerApiRef);
    const resourcesApi = apiHolder.get(resourcesApiRef);

    if (!useOidcFallback) {
      if (!agentsApi || !catalogApi || !policyManagerApi || !resourcesApi) {
        throw new Error(
          'DCM clients are not available from the host API holder.',
        );
      }

      return { agentsApi, catalogApi, policyManagerApi, resourcesApi };
    }

    const getAccessToken = getAccessTokenProvider(authEnabled, oidcAuthApi);
    const options = { discoveryApi, fetchApi, getAccessToken };

    return {
      agentsApi:
        agentsApi && !isDefaultDcmClient(agentsApi)
          ? agentsApi
          : new AgentsClient(options),
      catalogApi:
        catalogApi && !isDefaultDcmClient(catalogApi)
          ? catalogApi
          : new CatalogClient(options),
      policyManagerApi:
        policyManagerApi && !isDefaultDcmClient(policyManagerApi)
          ? policyManagerApi
          : new PolicyManagerClient(options),
      resourcesApi:
        resourcesApi && !isDefaultDcmClient(resourcesApi)
          ? resourcesApi
          : new ResourcesClient(options),
    };
  }, [
    apiHolder,
    authEnabled,
    discoveryApi,
    fetchApi,
    oidcAuthApi,
    useOidcFallback,
  ]);

  return (
    <DcmClientsContext.Provider value={clients}>
      {children}
    </DcmClientsContext.Provider>
  );
}

/** Provides test doubles for DCM page tests. */
export function DcmClientsTestProvider({
  children,
  clients,
}: {
  children: ReactNode;
  clients: DcmClientsTestDoubles;
}) {
  return (
    <DcmClientsContext.Provider value={clients as DcmClients}>
      {children}
    </DcmClientsContext.Provider>
  );
}

/** Returns the DCM clients for the current route. */
export function useDcmClients(): DcmClients {
  const clients = useContext(DcmClientsContext);
  if (!clients) {
    throw new Error('DCM clients are unavailable outside DcmClientsProvider.');
  }
  return clients;
}
