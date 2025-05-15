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

import { ConfigApi } from '@backstage/core-plugin-api';
import { KubeBackendClient } from '../KubeBackendClient';
import { SecureFetchApi } from '../SecureFetchClient';
import {
  DeploymentData,
  PersistentVolumeClaimData,
  StatefulSetData,
  SecretItem,
} from '../../types';

// Helper to create a mock Response object
const createMockResponse = (options: {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<any>;
}): Response => {
  const { ok, status = 200, statusText = '', json } = options;
  return {
    ok,
    status,
    statusText,
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: 'http://mock',
    json: json || (() => Promise.resolve({})),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    bodyUsed: false,
    body: null,
    clone: function () {
      return this;
    },
  } as Response;
};

const commonMetadata = {
  uuid: 'test-uuid',
  creationTimestamp: '2025-05-15T00:00:00Z',
  labels: {
    app: 'test',
  },
};

describe('KubeBackendClient', () => {
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockSecureFetchApi: jest.Mocked<SecureFetchApi>;
  let client: KubeBackendClient;
  const testNamespace = 'test-namespace';
  const mockKubeApi = 'http://kube-api';

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn(),
      getOptionalString: jest.fn(),
    } as any;

    mockSecureFetchApi = {
      fetch: jest.fn(),
    } as any;

    client = new KubeBackendClient({
      configApi: mockConfigApi,
      secureFetchApi: mockSecureFetchApi,
    });

    mockConfigApi.getString.mockReturnValue(mockKubeApi);
  });

  describe('deleteSecretsAndPVCs', () => {
    const mockDeploymentData: DeploymentData = {
      items: [
        {
          metadata: {
            name: 'test-deployment',
            ...commonMetadata,
          },
          status: {
            conditions: [{ type: 'Available', status: 'True' }],
          },
          spec: {
            replicas: 1,
            template: {
              metadata: {
                labels: {
                  app: 'test',
                  deployment: 'test',
                },
              },
              spec: {
                volumes: [
                  {
                    persistentVolumeClaim: { claimName: 'test-pvc' },
                    name: 'test-volume',
                  },
                  {
                    secret: { secretName: 'test-secret' },
                    name: 'test-secret-volume',
                  },
                ],
              },
            },
          },
        },
      ],
    };

    it('should delete PVCs and secrets successfully', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(
        client.deleteSecretsAndPVCs(mockDeploymentData, testNamespace),
      ).resolves.not.toThrow();

      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/namespaces/${testNamespace}/persistentvolumeclaims/test-pvc`,
        ),
        expect.objectContaining({ method: 'DELETE' }),
      );

      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/namespaces/${testNamespace}/secrets/test-secret`,
        ),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should not throw on 404 responses', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 404,
        }),
      );

      await expect(
        client.deleteSecretsAndPVCs(mockDeploymentData, testNamespace),
      ).resolves.not.toThrow();
    });

    it('should throw on other error responses', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal error' }),
        }),
      );

      await expect(
        client.deleteSecretsAndPVCs(mockDeploymentData, testNamespace),
      ).rejects.toThrow();
    });
  });

  describe('deletePVCsForSTS', () => {
    const mockStatefulSetData: StatefulSetData = {
      items: [
        {
          metadata: {
            name: 'test-statefulset',
            ...commonMetadata,
          },
          spec: {
            replicas: 1,
            template: {
              metadata: {
                labels: {
                  app: 'test',
                  deployment: 'test',
                },
              },
              spec: {},
            },
            volumeClaimTemplates: [
              {
                metadata: {
                  name: 'test-template',
                  ...commonMetadata,
                },
              },
            ],
          },
          status: {
            conditions: [],
          },
        },
      ],
    };

    const mockPVCData: PersistentVolumeClaimData = {
      items: [
        {
          metadata: {
            name: 'test-pvc-1',
            ...commonMetadata,
          },
        },
      ],
    };

    it('should delete PVCs for StatefulSet successfully', async () => {
      mockSecureFetchApi.fetch
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            json: () => Promise.resolve(mockPVCData),
          }),
        )
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
          }),
        );

      await expect(
        client.deletePVCsForSTS(mockStatefulSetData, testNamespace),
      ).resolves.not.toThrow();

      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/namespaces/${testNamespace}/persistentvolumeclaims/test-pvc-1`,
        ),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('getSecret', () => {
    const secretName = 'test-secret';
    const mockSecret: SecretItem = {
      metadata: {
        name: secretName,
        uuid: 'test-secret-uuid',
        creationTimestamp: '2025-05-15T00:00:00Z',
      },
      data: { password: 'test-value' },
    };

    it('should return secret data on successful response', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockSecret),
        }),
      );

      const result = await client.getSecret(testNamespace, secretName);
      expect(result).toEqual(mockSecret);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/namespaces/${testNamespace}/secrets/${secretName}`,
        ),
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('getPersistentVolumeClaims', () => {
    const mockPVCs: PersistentVolumeClaimData = {
      items: [
        {
          metadata: {
            name: 'pvc-1',
            ...commonMetadata,
          },
        },
        {
          metadata: {
            name: 'pvc-2',
            ...commonMetadata,
          },
        },
      ],
    };

    it('should return PVCs without labels', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockPVCs),
        }),
      );

      const result = await client.getPersistentVolumeClaims(testNamespace);
      expect(result).toEqual(mockPVCs);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/namespaces/${testNamespace}/persistentvolumeclaims`,
        ),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return PVCs with label selector', async () => {
      const labels = 'app=test';
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockPVCs),
        }),
      );

      await client.getPersistentVolumeClaims(testNamespace, labels);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`labelSelector=${labels}`),
        expect.any(Object),
      );
    });
  });

  describe('getDeployments', () => {
    const mockDeployments: DeploymentData = {
      items: [
        {
          metadata: {
            name: 'deployment-1',
            ...commonMetadata,
          },
          status: {
            conditions: [{ type: 'Available', status: 'True' }],
          },
          spec: {
            replicas: 1,
            template: {
              metadata: {
                labels: {
                  app: 'test',
                  deployment: 'test',
                },
              },
              spec: {},
            },
          },
        },
        {
          metadata: {
            name: 'deployment-2',
            ...commonMetadata,
          },
          status: {
            conditions: [{ type: 'Available', status: 'True' }],
          },
          spec: {
            replicas: 1,
            template: {
              metadata: {
                labels: {
                  app: 'test',
                  deployment: 'test',
                },
              },
              spec: {},
            },
          },
        },
      ],
    };

    it('should return deployments without labels', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockDeployments),
        }),
      );

      const result = await client.getDeployments(testNamespace);
      expect(result).toEqual(mockDeployments);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/apis/apps/v1/namespaces/${testNamespace}/deployments`,
        ),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return deployments with label selector', async () => {
      const labels = 'app=test';
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockDeployments),
        }),
      );

      await client.getDeployments(testNamespace, labels);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`labelSelector=${labels}`),
        expect.any(Object),
      );
    });
  });

  describe('getStatefulSets', () => {
    const mockStatefulSets: StatefulSetData = {
      items: [
        {
          metadata: {
            name: 'statefulset-1',
            ...commonMetadata,
          },
          status: {
            conditions: [{ type: 'Available', status: 'True' }],
          },
          spec: {
            replicas: 1,
            template: {
              metadata: {
                labels: {
                  app: 'test',
                  deployment: 'test',
                },
              },
              spec: {},
            },
          },
        },
        {
          metadata: {
            name: 'statefulset-2',
            ...commonMetadata,
          },
          status: {
            conditions: [{ type: 'Available', status: 'True' }],
          },
          spec: {
            replicas: 1,
            template: {
              metadata: {
                labels: {
                  app: 'test',
                  deployment: 'test',
                },
              },
              spec: {},
            },
          },
        },
      ],
    };

    it('should return statefulsets without labels', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockStatefulSets),
        }),
      );

      const result = await client.getStatefulSets(testNamespace);
      expect(result).toEqual(mockStatefulSets);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/apis/apps/v1/namespaces/${testNamespace}/statefulsets`,
        ),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return statefulsets with label selector', async () => {
      const labels = 'app=test';
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockStatefulSets),
        }),
      );

      await client.getStatefulSets(testNamespace, labels);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`labelSelector=${labels}`),
        expect.any(Object),
      );
    });
  });
});
