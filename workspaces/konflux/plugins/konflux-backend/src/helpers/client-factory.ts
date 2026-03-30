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
import { KonfluxConfig } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import type { KubeConfig, CustomObjectsApi } from '@kubernetes/client-node';
import { KonfluxLogger } from './logger';
import { getKubeClient } from './kube-client';

/**
 * Cache for CustomObjectsApi clients keyed by "cluster:apiUrl".
 *
 * Per-request auth headers are injected via middleware in the callers,
 * so cached clients are safe to share across users.
 *
 *  Caching avoids creating a new KubeConfig, CustomObjectsApi, and TLS
 * connection on every API call.
 */
const clientCache = new Map<string, CustomObjectsApi>();

/**
 * Creates a KubeConfig for connecting to a Kubernetes cluster.
 *
 * @param konfluxConfig - Konflux configuration
 * @param cluster - Cluster name
 * @param konfluxLogger - Logger instance
 * @param token - Optional authentication token (falls back to serviceAccountToken)
 * @param useKubearchiveUrl - If true, uses kubearchiveApiUrl instead of apiUrl
 * @returns KubeConfig instance or null if creation fails
 */
export const createKubeConfig = async (
  konfluxConfig: KonfluxConfig | undefined,
  cluster: string,
  konfluxLogger: KonfluxLogger,
  token?: string,
  useKubearchiveUrl = false,
): Promise<KubeConfig | null> => {
  try {
    if (!konfluxConfig) {
      return null;
    }

    const { KubeConfig } = await getKubeClient();
    const kubeConfig = new KubeConfig();

    const clusterConfig = konfluxConfig.clusters?.[cluster];

    if (!clusterConfig) {
      throw new Error('Cluster Config not found.');
    }

    const apiUrl = useKubearchiveUrl
      ? clusterConfig.kubearchiveApiUrl
      : clusterConfig.apiUrl;

    if (!apiUrl) {
      throw new Error(
        useKubearchiveUrl
          ? 'Cluster Config missing kubearchiveApiUrl.'
          : 'Cluster Config missing API url.',
      );
    }

    const userToken = token || clusterConfig.serviceAccountToken;

    const user = {
      name: 'backstage',
      token: userToken,
    };

    const context = {
      name: cluster,
      user: user.name,
      cluster: cluster,
    };

    kubeConfig.loadFromOptions({
      clusters: [
        {
          server: apiUrl,
          name: cluster,
        },
      ],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    });

    return kubeConfig;
  } catch (e) {
    konfluxLogger.error('Error creating Kube Config', e, {
      cluster,
    });
    return null;
  }
};

/**
 * Returns a cached CustomObjectsApi client for the given cluster, creating
 * one on first access. The client is safe to share across requests because
 * auth headers are injected per-request via middleware.
 *
 * @param konfluxConfig - Konflux configuration
 * @param cluster - Cluster name
 * @param konfluxLogger - Logger instance
 * @param useKubearchiveUrl - If true, targets the kubearchive API URL
 * @returns CustomObjectsApi instance or null if client creation fails
 */
export const getOrCreateClient = async (
  konfluxConfig: KonfluxConfig | undefined,
  cluster: string,
  konfluxLogger: KonfluxLogger,
  useKubearchiveUrl = false,
): Promise<CustomObjectsApi | null> => {
  if (!konfluxConfig) {
    return null;
  }

  const clusterConfig = konfluxConfig.clusters?.[cluster];
  const apiUrl = useKubearchiveUrl
    ? clusterConfig?.kubearchiveApiUrl
    : clusterConfig?.apiUrl;

  const cacheKey = `${cluster}:${apiUrl}`;

  const cached = clientCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const kc = await createKubeConfig(
    konfluxConfig,
    cluster,
    konfluxLogger,
    clusterConfig?.serviceAccountToken,
    useKubearchiveUrl,
  );

  if (!kc) {
    return null;
  }

  const { CustomObjectsApi } = await getKubeClient();
  const client = kc.makeApiClient(CustomObjectsApi);
  clientCache.set(cacheKey, client);
  return client;
};
