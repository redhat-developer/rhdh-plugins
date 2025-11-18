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
import { CustomObjectsApi } from '@kubernetes/client-node';
import { KonfluxLogger } from '../helpers/logger';
import { getAuthToken } from '../helpers/auth';
import { createKubeConfig } from '../helpers/client-factory';

/**
 * Options for fetching resources from Kubearchive
 */
interface FetchResourcesOptions {
  konfluxConfig: KonfluxConfig;
  userEmail: string;
  cluster: string;
  apiGroup: string;
  apiVersion: string;
  resource: string;
  namespace: string;
  options?: {
    pageSize?: number;
    pageToken?: string;
    filter?: string; // TODO: handle filter
    labelSelector?: string; // TODO: handle labelSelector
  };
  oidcToken?: string;
}

export class KubearchiveService {
  private readonly logger: KonfluxLogger;

  constructor(logger: LoggerService) {
    this.logger = new KonfluxLogger(logger);
  }

  /**
   * Fetch resources from Kubearchive using the Kubernetes API pattern
   */
  async fetchResources(
    params: FetchResourcesOptions,
  ): Promise<{ results: any[]; nextPageToken?: string }> {
    const {
      konfluxConfig,
      userEmail,
      cluster,
      apiGroup,
      apiVersion,
      resource,
      namespace,
      options = {},
      oidcToken,
    } = params;
    try {
      const clusterConfig = konfluxConfig?.clusters[cluster];

      const { token, requiresImpersonation } = getAuthToken(
        konfluxConfig,
        clusterConfig,
        oidcToken,
        userEmail,
        this.logger,
        { cluster, namespace, resource },
      );

      const kc = createKubeConfig(
        konfluxConfig,
        cluster,
        this.logger,
        token,
        true, // useKubearchiveUrl = true
      );
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
            ...(requiresImpersonation && {
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
