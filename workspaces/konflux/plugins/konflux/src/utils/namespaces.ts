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

import { SubcomponentClusterConfig } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Get applications for a specific subcomponent in a specific cluster/namespace
 */
export const getSubcomponentApplications = (
  clusterName: string,
  namespace: string,
  subcomponentConfigs: SubcomponentClusterConfig[],
): string[] => {
  const applications = subcomponentConfigs
    .filter(
      config =>
        config.cluster === clusterName && config.namespace === namespace,
    )
    .flatMap(config => config.applications);
  return Array.from(new Set(applications));
};
