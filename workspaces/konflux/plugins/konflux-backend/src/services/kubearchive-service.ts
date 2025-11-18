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

import { LoggerService } from '@backstage/backend-plugin-api';
import {
  K8sResourceCommonWithClusterInfo,
  KonfluxConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { CustomObjectsApi, KubeConfig } from '@kubernetes/client-node';
import { KonfluxLogger } from '../helpers/logger';

export class KubearchiveService {
  private readonly logger: KonfluxLogger;

  constructor(logger: LoggerService) {
    this.logger = new KonfluxLogger(logger);
  }

  private createKubeConfig(
    konfluxConfig: KonfluxConfig | undefined,
    cluster: string,
    token?: string,
  ): KubeConfig | null {
    try {
      if (!konfluxConfig) {
        return null;
      }

      const kubeConfig = new KubeConfig();

      const clusterConfig = konfluxConfig.clusters?.[cluster];

      if (!clusterConfig) {
        throw new Error('Cluster Config not found.');
      }

      if (!clusterConfig?.kubearchiveApiUrl) {
        throw new Error('Cluster Config missing kubearchiveApiUrl.');
      }

      // Use provided token if available, otherwise fallback to serviceAccountToken
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
            server: clusterConfig.kubearchiveApiUrl,
            name: cluster,
          },
        ],
        users: [user],
        contexts: [context],
        currentContext: context.name,
      });

      return kubeConfig;
    } catch (e) {
      this.logger.error('Error creating Kube Config', e, {
        cluster,
      });
      return null;
    }
  }

  /**
   * List all results with optional filtering
   */
  /**
   * Fetch resources from Kubearchive using the Kubernetes API pattern
   * @param cluster - Target cluster name
   * @param apiGroup - API group (e.g., 'tekton.dev', 'apps', '')
   * @param apiVersion - API version (e.g., 'v1', 'v1beta1')
   * @param resource - Resource type (e.g., 'pipelineruns', 'pods', 'deployments')
   * @param namespace - Namespace to search in
   * @param options - Additional query options
   */
  async fetchResources(
    konfluxConfig: KonfluxConfig,
    userEmail: string,
    cluster: string,
    apiGroup: string,
    apiVersion: string,
    resource: string,
    namespace: string,
    options: {
      pageSize?: number;
      pageToken?: string;
      filter?: string; // TODO: handle filter
      labelSelector?: string; // TODO: handle labelSelector
    } = {},
    oidcToken?: string,
  ): Promise<{ results: any[]; nextPageToken?: string }> {
    try {
      const clusterConfig = konfluxConfig?.clusters[cluster];

      let token: string | undefined;

      if (konfluxConfig?.authProvider === 'oidc') {
        if (oidcToken) {
          token = oidcToken;
          this.logger.debug('Using OIDC token for Kubearchive', {
            cluster,
            namespace,
            resource,
          });
        } else {
          this.logger.error(
            'OIDC authProvider configured but no token available',
            undefined,
            {
              cluster,
              namespace,
              resource,
            },
          );
          throw new Error(
            `OIDC authProvider configured for cluster ${cluster} but no token available`,
          );
        }
      } else {
        token = clusterConfig?.serviceAccountToken;
      }

      if (!token) {
        this.logger.error(
          'No authentication token available for Kubearchive',
          undefined,
          {
            cluster,
            namespace,
            resource,
            authProvider: konfluxConfig?.authProvider,
          },
        );
        throw new Error(
          `No authentication token available for cluster ${cluster}`,
        );
      }

      if (
        konfluxConfig?.authProvider === 'impersonationHeaders' &&
        (!userEmail || userEmail.trim().length === 0)
      ) {
        this.logger.error(
          'Impersonation headers required but user email is missing',
          undefined,
          {
            cluster,
            namespace,
            resource,
            authProvider: konfluxConfig?.authProvider,
          },
        );
        throw new Error(
          `User email is required for impersonation but was not provided for cluster ${cluster}`,
        );
      }

      const kc = this.createKubeConfig(konfluxConfig, cluster, token);
      if (!kc) {
        this.logger.error(
          'Failed to create KubeConfig - cluster not found',
          undefined,
          {
            cluster,
            namespace,
            resource,
          },
        );
        throw new Error(`Cluster '${cluster}' not found`);
      }

      const params = new URLSearchParams();
      if (options.pageSize) params.append('limit', options.pageSize.toString());
      if (options.pageToken) params.append('continue', options.pageToken);
      if (options.labelSelector)
        params.append('labelSelector', options.labelSelector);

      const customApi = kc.makeApiClient(CustomObjectsApi);
      const response = await customApi.listNamespacedCustomObject(
        apiGroup,
        apiVersion,
        namespace,
        resource,
        undefined,
        undefined,
        options.pageToken,
        undefined,
        options.labelSelector,
        options.pageSize,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            ...(konfluxConfig?.authProvider === 'impersonationHeaders' && {
              'Impersonate-User': userEmail,
              'Impersonate-Group': 'system:authenticated',
            }),
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const responseBody = response?.body as {
        items: K8sResourceCommonWithClusterInfo[];
        metadata?: {
          continue?: string;
        };
      };

      const items = responseBody?.items;
      const nextPageToken = responseBody?.metadata?.continue;

      this.logger.debug('Fetched items from Kubearchive', {
        cluster,
        namespace,
        resource,
        itemCount: items?.length || 0,
        hasNextPageToken: !!nextPageToken,
      });

      return {
        results: items,
        nextPageToken,
      };
    } catch (error) {
      this.logger.error('Error fetching from Kubearchive', error, {
        cluster,
        namespace,
        resource,
        apiGroup,
        apiVersion,
      });
      throw error;
    }
  }
}
