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
import type { Config } from '@backstage/config';
import { createRouter } from './router';
import { setupInformer } from './services/InformerService';
import type { ReconcilerConfig } from './services/types';

/**
 * Safely read an optional string from a Backstage Config object.
 * ConfigReader throws TypeError for empty-string values from
 * env var substitution like ${VAR:-}, so we catch and return undefined.
 */
function safeGetOptionalString(cfg: Config, key: string): string | undefined {
  try {
    return cfg.getOptionalString(key);
  } catch {
    // ConfigReader throws TypeError for empty-string values
    // from env var substitution like ${VAR:-}
    return undefined;
  }
}

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
        const reconcilerConfig: ReconcilerConfig = {};

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

            // Read plugin-specific fields from cluster sub-config
            reconcilerConfig.catalogUrl = safeGetOptionalString(
              clusterConfig,
              'kubeflow-model-catalog-url',
            );
            reconcilerConfig.defaultOwner =
              safeGetOptionalString(clusterConfig, 'default-owner') ||
              undefined;
            reconcilerConfig.defaultLifecycle =
              safeGetOptionalString(clusterConfig, 'default-lifecycle') ||
              undefined;
            reconcilerConfig.clusterName = safeGetOptionalString(
              clusterConfig,
              'name',
            );

            // kubernetesPluginRef lookup (D7 precedence step 1)
            const kubernetesPluginRef = safeGetOptionalString(
              clusterConfig,
              'kubernetesPluginRef',
            );
            if (kubernetesPluginRef) {
              let matched = false;
              const k8sConfig = config.getOptionalConfig('kubernetes');
              if (k8sConfig) {
                const locators =
                  k8sConfig.getOptionalConfigArray('clusterLocatorMethods') ??
                  [];
                for (const locator of locators) {
                  if (safeGetOptionalString(locator, 'type') !== 'config') {
                    continue;
                  }
                  const clusters =
                    locator.getOptionalConfigArray('clusters') ?? [];
                  for (const cluster of clusters) {
                    if (
                      safeGetOptionalString(cluster, 'name') ===
                      kubernetesPluginRef
                    ) {
                      matched = true;
                      reconcilerConfig.url = safeGetOptionalString(
                        cluster,
                        'url',
                      );
                      reconcilerConfig.serviceAccountToken =
                        safeGetOptionalString(cluster, 'serviceAccountToken');
                      reconcilerConfig.skipTLSVerify =
                        cluster.getOptionalBoolean('skipTLSVerify');
                      reconcilerConfig.caData = safeGetOptionalString(
                        cluster,
                        'caData',
                      );

                      // Post-match: validate BOTH url AND serviceAccountToken
                      if (
                        !reconcilerConfig.url ||
                        !reconcilerConfig.serviceAccountToken
                      ) {
                        logger.warn(
                          `kubernetesPluginRef '${kubernetesPluginRef}' matched but has incomplete K8s fields (url: ${!!reconcilerConfig.url}, serviceAccountToken: ${!!reconcilerConfig.serviceAccountToken}); clearing stale fields and falling through to direct config`,
                        );
                        reconcilerConfig.url = undefined;
                        reconcilerConfig.serviceAccountToken = undefined;
                        reconcilerConfig.skipTLSVerify = undefined;
                        reconcilerConfig.caData = undefined;
                      } else {
                        // Check authProvider — warn if not serviceAccount
                        const authProvider = safeGetOptionalString(
                          cluster,
                          'authProvider',
                        );
                        if (authProvider && authProvider !== 'serviceAccount') {
                          logger.warn(
                            `kubernetesPluginRef '${kubernetesPluginRef}' has authProvider '${authProvider}'; only serviceAccount is supported, proceeding with serviceAccountToken`,
                          );
                        }
                      }
                      break;
                    }
                  }
                  if (matched) break;
                }
              }
              if (!matched) {
                logger.warn(
                  `kubernetesPluginRef '${kubernetesPluginRef}' not found in kubernetes.clusterLocatorMethods; falling through to direct config`,
                );
              }
            }

            // Direct config fallback (D7 precedence step 3)
            if (
              !reconcilerConfig.url ||
              !reconcilerConfig.serviceAccountToken
            ) {
              const directUrl = safeGetOptionalString(clusterConfig, 'url');
              const directToken = safeGetOptionalString(
                clusterConfig,
                'serviceAccountToken',
              );
              if (directUrl && directToken) {
                reconcilerConfig.url = directUrl;
                reconcilerConfig.serviceAccountToken = directToken;
                const directSkipTLS =
                  clusterConfig.getOptionalBoolean('skipTLSVerify');
                if (directSkipTLS !== undefined) {
                  reconcilerConfig.skipTLSVerify = directSkipTLS;
                }
                const directCaData = safeGetOptionalString(
                  clusterConfig,
                  'caData',
                );
                if (directCaData) {
                  reconcilerConfig.caData = directCaData;
                }
              } else if (directUrl || directToken) {
                logger.warn(
                  `Partial direct config for cluster '${
                    reconcilerConfig.clusterName || 'unknown'
                  }': both url and serviceAccountToken are required; falling through to loadFromDefault()`,
                );
              }
            }
          }
        }

        setupInformer(reconcilerConfig, logger).catch(error => {
          logger.error('Failed to set up informer', error as Error);
        });
        httpRouter.use(await createRouter(logger));
      },
    });
  },
});
