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
 * Convert a glob pattern (e.g. "app-*", "*api*") to a RegExp
 */
const globToRegex = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regexStr}$`);
};

/**
 * Check if a name matches any of the given application patterns.
 * Supports exact matches and glob patterns with "*".
 */
export const matchesApplicationPattern = (
  name: string,
  patterns: string[],
): boolean => {
  return patterns.some(pattern =>
    pattern.includes('*') ? globToRegex(pattern).test(name) : pattern === name,
  );
};

/**
 * Filter resources by application names or glob patterns
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
        return matchesApplicationPattern(
          item.metadata?.name || '',
          applicationNames,
        );
      case 'components':
        return matchesApplicationPattern(
          (item.spec?.application as string) || '',
          applicationNames,
        );
      case 'releases':
      case 'pipelineruns':
        return matchesApplicationPattern(
          applicationName || '',
          applicationNames,
        );
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
