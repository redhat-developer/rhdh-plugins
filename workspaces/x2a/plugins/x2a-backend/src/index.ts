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
import { createBackendFeatureLoader } from '@backstage/backend-plugin-api';
import { x2APlugin } from './plugin';
import { x2aDatabaseServiceFactory } from './services/X2ADatabaseService';
import { kubeServiceFactory } from './services/KubeService';

/**
 * Default export: a feature loader that registers the x2a plugin together
 * with the service factories for x2a-node's canonical service refs.
 *
 * Bundling them here ensures RHDH's dynamic plugin loader (which only
 * reads the default export) picks up the factories alongside the plugin.
 *
 * @public
 */
export default createBackendFeatureLoader({
  *loader() {
    yield x2APlugin;
    yield x2aDatabaseServiceFactory;
    yield kubeServiceFactory;
  },
});

export { x2APlugin } from './plugin';
export { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
export { x2aDatabaseServiceFactory } from './services/X2ADatabaseService';
export { kubeServiceRef } from './services/KubeService';
export { kubeServiceFactory } from './services/KubeService';

// Re-export from x2a-node for backward compatibility
export type {
  JobStatusInfo,
  AAPCredentials,
  GitRepo,
  JobCreateParams,
  CreateJobInput,
  ReconcileJobDeps,
  X2ADatabaseServiceApi,
  KubeServiceApi,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';
export {
  getUserRef,
  getGroupsOfUser,
  reconcileJobStatus,
  generateCallbackToken,
  X2A_DATABASE_SERVICE_ID,
  KUBE_SERVICE_ID,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';
