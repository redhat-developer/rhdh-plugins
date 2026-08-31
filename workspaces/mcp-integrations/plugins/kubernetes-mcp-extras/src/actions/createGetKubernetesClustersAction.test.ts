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
import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { createGetKubernetesClustersAction } from './createGetKubernetesClustersAction';

const discovery = {
  getBaseUrl: jest.fn().mockResolvedValue('http://kubernetes.example.com'),
} as unknown as DiscoveryService;

const auth = {
  getPluginRequestToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
} as unknown as AuthService;

function mockFetchOnce(
  body: unknown,
  init?: { ok?: boolean; status?: number },
) {
  return jest.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: 'OK',
    json: async () => body,
  });
}

describe('createGetKubernetesClustersAction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an empty list when no clusters are registered', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetchOnce({ items: [] });

    createGetKubernetesClustersAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    const result = await actionsRegistry.invoke({
      id: 'test:get-kubernetes-clusters',
      input: {},
    });

    expect(result).toEqual({ output: { clusters: [] } });
  });

  it('maps cluster names, titles and dashboardUrl from the kubernetes API', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetchOnce({
      items: [
        {
          name: 'production',
          title: 'Production Cluster',
          dashboardUrl: 'https://dashboard.production.example.com',
          authProvider: 'serviceAccount',
        },
        { name: 'staging', authProvider: 'serviceAccount' },
      ],
    });

    createGetKubernetesClustersAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    const result = await actionsRegistry.invoke({
      id: 'test:get-kubernetes-clusters',
      input: {},
    });

    expect(result).toEqual({
      output: {
        clusters: [
          {
            name: 'production',
            title: 'Production Cluster',
            dashboardUrl: 'https://dashboard.production.example.com',
          },
          { name: 'staging' },
        ],
      },
    });
  });

  it('calls the kubernetes clusters endpoint with an on-behalf-of token', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetchOnce({ items: [] });

    createGetKubernetesClustersAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    await actionsRegistry.invoke({
      id: 'test:get-kubernetes-clusters',
      input: {},
    });

    expect(auth.getPluginRequestToken).toHaveBeenCalledWith(
      expect.objectContaining({ targetPluginId: 'kubernetes' }),
    );
    expect(fetchApi).toHaveBeenCalledWith(
      'http://kubernetes.example.com/clusters',
      { headers: { Authorization: 'Bearer test-token' } },
    );
  });

  it('throws when the kubernetes API responds with an error', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetchOnce({}, { ok: false, status: 500 });

    createGetKubernetesClustersAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    await expect(
      actionsRegistry.invoke({
        id: 'test:get-kubernetes-clusters',
        input: {},
      }),
    ).rejects.toThrow('Failed to fetch Kubernetes clusters: 500');
  });
});
