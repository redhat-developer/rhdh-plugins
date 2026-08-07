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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import {
  setupInformer,
  type ConnectorConfig,
} from './services/InformerService';

/**
 * kserveKubeflowConnectorPlugin backend plugin
 *
 * @public
 */
export const kserveKubeflowConnectorPlugin = createBackendPlugin({
  pluginId: 'kserve-kubeflow-connector',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ logger, httpRouter, config }) {
        let connectorConfig: ConnectorConfig | undefined;

        const providerConfigs = config.getOptionalConfig(
          'catalog.providers.modelCatalog',
        );
        if (providerConfigs) {
          const connectorKeys = providerConfigs.keys();
          if (connectorKeys.length > 0) {
            const connectorLevelConfig = providerConfigs.getConfig(
              connectorKeys[0],
            );
            // Navigate cluster sub-keys under the connector key.
            // TODO: Multi-cluster support — iterate all cluster sub-keys
            // instead of using only the first one.
            const clusterKeys = connectorLevelConfig.keys();
            let clusterConfig = connectorLevelConfig;
            for (const ck of clusterKeys) {
              const sub = connectorLevelConfig.getOptionalConfig(ck);
              if (!sub || sub.has('frequency') || sub.has('timeout')) {
                continue;
              }
              clusterConfig = sub;
              break;
            }
            connectorConfig = {
              catalogUrl: clusterConfig.getOptionalString(
                'kubeflow-model-catalog-url',
              ),
              defaultOwner:
                clusterConfig.getOptionalString('default-owner') || undefined,
              defaultLifecycle:
                clusterConfig.getOptionalString('default-lifecycle') ||
                undefined,
            };
          }
        }

        setupInformer(connectorConfig).catch(error => {
          logger.error('Failed to set up informer:', error);
        });
        httpRouter.use(await createRouter());
      },
    });
  },
});
