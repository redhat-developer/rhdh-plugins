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

import { useMemo } from 'react';
import { ComponentResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

type Props = {
  components: ComponentResource[] | undefined;
  hasSubcomponents: boolean;
};

type UseComponentFiltersReturnType = {
  uniqueSubcomponents: string[];
  uniqueClusters: string[];
  uniqueApplications: string[];
};

export const useComponentFilters = ({
  components,
  hasSubcomponents,
}: Props): UseComponentFiltersReturnType => {
  return useMemo(() => {
    if (!components) {
      return {
        uniqueSubcomponents: [],
        uniqueClusters: [],
        uniqueApplications: [],
      };
    }

    const uniqueSubcomponents: string[] = [];
    const uniqueClusters: string[] = [];
    const uniqueApplications: string[] = [];

    components.forEach(component => {
      const subcomponentName = component.subcomponent.name;
      const clusterName = component.cluster.name;
      const applicationName = component.spec?.application as string;

      if (subcomponentName) uniqueSubcomponents.push(subcomponentName);
      if (clusterName) uniqueClusters.push(clusterName);
      if (applicationName) uniqueApplications.push(applicationName);
    });

    return {
      uniqueSubcomponents: hasSubcomponents
        ? Array.from(new Set(uniqueSubcomponents)).sort((a, b) =>
            a.localeCompare(b),
          )
        : [],
      uniqueClusters: Array.from(new Set(uniqueClusters)).sort((a, b) =>
        a.localeCompare(b),
      ),
      uniqueApplications: Array.from(new Set(uniqueApplications)).sort((a, b) =>
        a.localeCompare(b),
      ),
    };
  }, [components, hasSubcomponents]);
};
