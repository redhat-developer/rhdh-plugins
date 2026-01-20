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
  getApplicationFromResource,
  K8sResourceCommonWithClusterInfo,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Filter resources by application names
 */
export const filterResourcesByApplication = (
  items: K8sResourceCommonWithClusterInfo[],
  resourceType: string,
  applicationNames: string[],
): K8sResourceCommonWithClusterInfo[] => {
  if (
    !items ||
    items.length === 0 ||
    !applicationNames ||
    applicationNames.length === 0
  ) {
    return items;
  }

  return items.filter(item => {
    const applicationName = getApplicationFromResource(item);
    switch (resourceType) {
      case 'applications':
        return applicationNames.includes(item.metadata?.name || '');
      case 'components':
        return applicationNames.includes(
          (item.spec?.application as string) || '',
        );
      case 'releases':
      case 'pipelineruns':
        return applicationNames.includes(applicationName || '');
      default:
        return true;
    }
  });
};

export const createResourceWithClusterInfo = (
  resource: K8sResourceCommonWithClusterInfo,
  clusterName: string,
  subcomponentName: string | undefined,
  konfluxUI: string | undefined,
): K8sResourceCommonWithClusterInfo => ({
  ...resource,
  cluster: {
    name: clusterName,
    konfluxUI,
  },
  ...(subcomponentName && {
    subcomponent: { name: subcomponentName },
  }),
});
