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
import { createGetKubernetesResourcesForEntityAction } from './createGetKubernetesResourcesForEntityAction';

const discovery = {
  getBaseUrl: jest.fn().mockResolvedValue('http://kubernetes.example.com'),
} as unknown as DiscoveryService;

const auth = {
  getPluginRequestToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
} as unknown as AuthService;

const mockK8sResponse = {
  items: [
    {
      cluster: { name: 'production' },
      resources: [
        {
          type: 'deployments',
          resources: [
            {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              metadata: { name: 'my-service', namespace: 'default' },
            },
          ],
        },
      ],
      podMetrics: [],
      errors: [],
    },
  ],
};

function mockFetch(
  body: unknown,
  init?: { ok?: boolean; status?: number; statusText?: string },
) {
  const text = JSON.stringify(body);
  return jest.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: async () => body,
    text: async () => text,
  });
}

describe('createGetKubernetesResourcesForEntityAction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the resources reported by the kubernetes API', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetch(mockK8sResponse);

    createGetKubernetesResourcesForEntityAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    const result = await actionsRegistry.invoke({
      id: 'test:get-kubernetes-resources-for-entity',
      input: { name: 'my-service' },
    });
    const output = result.output as { items: Array<Record<string, unknown>> };

    expect(output.items).toHaveLength(1);
    expect(output.items[0]).toMatchObject({ cluster: { name: 'production' } });
  });

  it('defaults kind to Component and namespace to default when omitted', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetch({ items: [] });

    createGetKubernetesResourcesForEntityAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    await actionsRegistry.invoke({
      id: 'test:get-kubernetes-resources-for-entity',
      input: { name: 'my-service' },
    });

    expect(fetchApi).toHaveBeenCalledWith(
      'http://kubernetes.example.com/resources/workloads/query',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          entityRef: 'component:default/my-service',
          auth: {},
        }),
      }),
    );
  });

  it('uses the provided kind and namespace', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetch({ items: [] });

    createGetKubernetesResourcesForEntityAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    await actionsRegistry.invoke({
      id: 'test:get-kubernetes-resources-for-entity',
      input: { name: 'my-worker', kind: 'Service', namespace: 'production' },
    });

    expect(fetchApi).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          entityRef: 'service:production/my-worker',
          auth: {},
        }),
      }),
    );
  });

  it('surfaces the error message from the kubernetes API on failure', async () => {
    const actionsRegistry = actionsRegistryServiceMock();
    const fetchApi = mockFetch(
      { error: { name: 'InputError', message: 'Entity ref missing' } },
      { ok: false, status: 400, statusText: 'Bad Request' },
    );

    createGetKubernetesResourcesForEntityAction({
      actionsRegistry,
      auth,
      discovery,
      fetchApi: fetchApi as any,
    });

    await expect(
      actionsRegistry.invoke({
        id: 'test:get-kubernetes-resources-for-entity',
        input: { name: 'does-not-exist' },
      }),
    ).rejects.toThrow(
      'Failed to fetch Kubernetes resources for entity "component:default/does-not-exist": Entity ref missing',
    );
  });
});
