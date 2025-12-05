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

import { K8sResourceCommonWithClusterInfo } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Creates a unique key for a resource item based on its metadata
 * Format: {name}-{namespace}-{clusterName}
 *
 * @param resource - The Kubernetes resource with cluster info
 * @returns A unique string key for the resource
 */
export const createItemKey = (
  resource: K8sResourceCommonWithClusterInfo,
): string => {
  return `${resource.metadata?.name}-${resource.metadata?.namespace}-${resource.cluster.name}`;
};
