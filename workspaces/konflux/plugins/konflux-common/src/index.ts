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

/**
 * Common functionalities for the konflux-common plugin.
 *
 * @packageDocumentation
 */

// Export all types
export type {
  ResourceData,
  ClusterError,
  ClusterErrors,
  ClusterInfo,
  SubcomponentInfo,
  K8sResourceIdentifier,
  OwnerReference,
  K8sResourceCommon,
  PipelineRunResource,
  ApplicationResource,
  ComponentResource,
  ReleaseResource,
  SubcomponentClusterConfig,
  KonfluxClusterConfig,
  KonfluxComponentConfig,
  K8sResourceCommonWithClusterInfo,
  KonfluxConfig,
  Filters,
  KonfluxComponentClusterConfig,
} from './types';

/**
 * Common GroupVersionKind type.
 *
 * @public
 */
export type GroupVersionKind = import('./types').GroupVersionKind;

export { ReleaseCondition, runStatus } from './types';

export {
  PipelineRunGVK,
  PipelineRunModel,
  TaskRunGVK,
  ApplicationGVK,
  ComponentGVK,
  ReleaseGVK,
  ModelsPlural,
  konfluxResourceModels,
} from './models';

export { PAGINATION_CONFIG } from './pagination';

export { KONFLUX_CLUSTER_CONFIG } from './consts';

export {
  FILTER_ALL_VALUE,
  FRONTEND_PAGINATION,
  TIME_CONSTANTS,
} from './constants';

export {
  parseEntityKonfluxConfig,
  parseClusterConfigs,
  parseSubcomponentClusterConfigurations,
  parseAuthProviderConfig,
} from './config';

export { PipelineRunLabel } from './pipeline-runs';

export { getApplicationFromResource } from './resources';

export { getSubcomponentsWithFallback, getSubcomponentNames } from './entities';
