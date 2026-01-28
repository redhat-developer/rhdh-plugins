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
import { CoreV1Api, KubeConfig } from '@kubernetes/client-node';

/**
 * TODO: Make this configurable
 *
 * Load Kubernetes config from default locations
 * This will check KUBECONFIG env var, ~/.kube/config, or ~/.kube/kubeconfig, or in-cluster config
 */
export const makeK8sClient = (logger: LoggerService): CoreV1Api => {
  const kc = new KubeConfig();

  try {
    // Set KUBECONFIG to ~/.kube/config as a fallback
    if (!process.env.KUBECONFIG) {
      const path = require('node:path');
      const os = require('node:os');
      const kubeconfigPath = path.join(os.homedir(), '.kube', 'config');
      const fs = require('node:fs');

      // Check if ~/.kube/config exists
      if (fs.existsSync(kubeconfigPath)) {
        process.env.KUBECONFIG = kubeconfigPath;
        logger.info(`Setting KUBECONFIG to ${kubeconfigPath}`);
      }
    }

    kc.loadFromDefault();
    logger.info(
      `Loaded Kubernetes configuration from ${process.env.KUBECONFIG || 'default location'}`,
    );
  } catch (error) {
    logger.warn(
      `Failed to load default Kubernetes config: ${error}. Will attempt to use cluster config.`,
    );
    try {
      kc.loadFromCluster();
      logger.info('Loaded in-cluster Kubernetes configuration');
    } catch (clusterError) {
      logger.error(`Failed to load Kubernetes configuration: ${clusterError}`);
      throw new Error(
        'Unable to load Kubernetes configuration. Please ensure KUBECONFIG is set or running in a cluster.',
      );
    }
  }

  return kc.makeApiClient(CoreV1Api);
};
