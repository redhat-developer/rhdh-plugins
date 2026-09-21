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

import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import type { JsonObject } from '@backstage/types';
import request from 'supertest';
import type { ReconcilerConfig } from './services/types';

/* eslint-disable no-var */
var mockSetupInformer: jest.Mock;
var mockGetDiscoveryUris: jest.Mock;
var mockGetModelCatalog: jest.Mock;
var mockGetModelCard: jest.Mock;
/* eslint-enable no-var */

jest.mock('./services/InformerService', () => {
  const _setupInformer = jest.fn().mockResolvedValue(undefined);
  const _getDiscoveryUris = jest
    .fn()
    .mockReturnValue({ uris: ['/models/ns/demo'] });
  const _getModelCatalog = jest.fn();
  const _getModelCard = jest.fn();

  mockSetupInformer = _setupInformer;
  mockGetDiscoveryUris = _getDiscoveryUris;
  mockGetModelCatalog = _getModelCatalog;
  mockGetModelCard = _getModelCard;

  return {
    setupInformer: _setupInformer,
    getDiscoveryUris: _getDiscoveryUris,
    getModelCatalog: _getModelCatalog,
    getModelCard: _getModelCard,
  };
});

import { kserveKubeflowConnectorPlugin } from './plugin';

const SIDECAR_KEYS = ['location', 'storage-rest', 'rhoai-normalizer'];

const BASE_APP_CONFIG = {
  app: { baseUrl: 'http://localhost:3000' },
  backend: { baseUrl: 'http://localhost:7007' },
};

function kubernetesPluginRefConfig(overrides?: {
  caData?: string;
  emptyCaData?: boolean;
}): JsonObject {
  const cluster: JsonObject = {
    name: 'my-k8s-cluster',
    url: 'https://api.cluster.example',
    serviceAccountToken: 'sa-token',
    authProvider: 'serviceAccount',
    skipTLSVerify: false,
  };
  if (overrides?.emptyCaData) {
    cluster.caData = '';
  } else if (overrides?.caData !== undefined) {
    cluster.caData = overrides.caData;
  } else {
    cluster.caData = 'Y2EtZGF0YQ==';
  }

  return {
    ...BASE_APP_CONFIG,
    catalog: {
      providers: {
        modelCatalog: {
          'kserve-kubeflow-connector': {
            'cluster-1': {
              name: 'my-k8s-cluster',
              kubernetesPluginRef: 'my-k8s-cluster',
              'default-owner': 'team-a',
              'default-lifecycle': 'production',
              'kubeflow-model-catalog-url': 'https://catalog.example',
            },
          },
        },
      },
    },
    kubernetes: {
      serviceLocatorMethod: { type: 'multiTenant' },
      clusterLocatorMethods: [
        {
          type: 'config',
          clusters: [cluster],
        },
      ],
    },
  };
}

function directClusterConfig(): JsonObject {
  return {
    ...BASE_APP_CONFIG,
    catalog: {
      providers: {
        modelCatalog: {
          'kserve-kubeflow-connector': {
            'cluster-1': {
              name: 'direct-cluster',
              url: 'https://direct.cluster.example',
              serviceAccountToken: 'direct-token',
              skipTLSVerify: true,
              caData: 'ZGlyZWN0LWNh',
              'default-owner': 'direct-owner',
              'default-lifecycle': 'staging',
            },
          },
        },
      },
    },
  };
}

async function startConnector(configData: JsonObject) {
  return startTestBackend({
    features: [
      kserveKubeflowConnectorPlugin,
      mockServices.rootLogger.factory(),
      mockServices.rootConfig.factory({ data: configData }),
    ],
  });
}

function latestReconcilerConfig(): ReconcilerConfig {
  expect(mockSetupInformer).toHaveBeenCalled();
  return mockSetupInformer.mock.calls[0][0] as ReconcilerConfig;
}

function assertNoSidecarKeys(config: JsonObject) {
  const serialized = JSON.stringify(config);
  for (const key of SIDECAR_KEYS) {
    expect(serialized).not.toContain(key);
  }
}

describe('kserveKubeflowConnectorPlugin integration (RHIDP-17134)', () => {
  jest.setTimeout(60_000);

  const originalK8sToken = process.env.K8S_TOKEN;
  const originalKubeconfig = process.env.KUBECONFIG;

  beforeEach(() => {
    delete process.env.K8S_TOKEN;
    delete process.env.KUBECONFIG;
    mockSetupInformer.mockClear();
    mockGetDiscoveryUris.mockClear();
    mockGetModelCatalog.mockClear();
    mockGetModelCard.mockClear();
    mockGetDiscoveryUris.mockReturnValue({ uris: ['/models/ns/demo'] });
  });

  afterEach(() => {
    if (originalK8sToken === undefined) {
      delete process.env.K8S_TOKEN;
    } else {
      process.env.K8S_TOKEN = originalK8sToken;
    }
    if (originalKubeconfig === undefined) {
      delete process.env.KUBECONFIG;
    } else {
      process.env.KUBECONFIG = originalKubeconfig;
    }
  });

  it('boots as a standalone plugin and serves GET /list without sidecar config or env credentials', async () => {
    const config = kubernetesPluginRefConfig();
    assertNoSidecarKeys(config);

    const { server } = await startConnector(config);

    const res = await request(server)
      .get('/api/kserve-kubeflow-connector/list')
      .set('Authorization', mockCredentials.user.header());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ uris: ['/models/ns/demo'] });
    expect(mockSetupInformer).toHaveBeenCalledTimes(1);
  });

  it('reads url, token, caData, and skipTLSVerify from kubernetes.clusterLocatorMethods via kubernetesPluginRef', async () => {
    const { server } = await startConnector(kubernetesPluginRefConfig());
    await request(server)
      .get('/api/kserve-kubeflow-connector/list')
      .set('Authorization', mockCredentials.user.header());

    const reconciler = latestReconcilerConfig();
    expect(reconciler.url).toBe('https://api.cluster.example');
    expect(reconciler.serviceAccountToken).toBe('sa-token');
    expect(reconciler.caData).toBe('Y2EtZGF0YQ==');
    expect(reconciler.skipTLSVerify).toBe(false);
    expect(reconciler.clusterName).toBe('my-k8s-cluster');
    expect(reconciler.catalogUrl).toBe('https://catalog.example');
    expect(reconciler.defaultOwner).toBe('team-a');
    expect(reconciler.defaultLifecycle).toBe('production');
    expect(reconciler).not.toHaveProperty('location');
    expect(reconciler).not.toHaveProperty('storage-rest');
    expect(reconciler).not.toHaveProperty('rhoai-normalizer');
  });

  it('does not throw when caData is an empty string from env substitution like ${VAR:-}', async () => {
    const { server } = await startConnector(
      kubernetesPluginRefConfig({ emptyCaData: true }),
    );

    const res = await request(server)
      .get('/api/kserve-kubeflow-connector/list')
      .set('Authorization', mockCredentials.user.header());

    expect(res.status).toBe(200);
    const reconciler = latestReconcilerConfig();
    expect(reconciler.url).toBe('https://api.cluster.example');
    expect(reconciler.serviceAccountToken).toBe('sa-token');
    expect(reconciler.caData).toBeUndefined();
  });

  it('falls through to direct cluster url and token when kubernetesPluginRef is omitted', async () => {
    const config = directClusterConfig();
    assertNoSidecarKeys(config);

    const { server } = await startConnector(config);
    await request(server)
      .get('/api/kserve-kubeflow-connector/list')
      .set('Authorization', mockCredentials.user.header());

    const reconciler = latestReconcilerConfig();
    expect(reconciler.url).toBe('https://direct.cluster.example');
    expect(reconciler.serviceAccountToken).toBe('direct-token');
    expect(reconciler.caData).toBe('ZGlyZWN0LWNh');
    expect(reconciler.skipTLSVerify).toBe(true);
    expect(reconciler.clusterName).toBe('direct-cluster');
  });
});
