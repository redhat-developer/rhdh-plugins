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
import { KubeConfig } from '@kubernetes/client-node';
import { KonfluxLogger } from './logger';

export const createKubeConfig = (
  konfluxConfig: KonfluxConfig | undefined,
  cluster: string,
  konfluxLogger: KonfluxLogger,
  token?: string,
): KubeConfig | null => {
  try {
    if (!konfluxConfig) {
      return null;
    }

    const kubeConfig = new KubeConfig();

    const clusterConfig = konfluxConfig.clusters?.[cluster];

    if (!clusterConfig) {
      throw new Error('Cluster Config not found.');
    }

    if (!clusterConfig?.apiUrl) {
      throw new Error('Cluster Config missing API url.');
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
          server: clusterConfig.apiUrl,
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
