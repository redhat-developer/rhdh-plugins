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
import { ApplicationResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

type Props = {
  applications: ApplicationResource[] | undefined;
  hasSubcomponents: boolean;
};

type UseApplicationFiltersReturnType = {
  uniqueSubcomponents: string[];
  uniqueClusters: string[];
};

export const useApplicationFilters = ({
  applications,
  hasSubcomponents,
}: Props): UseApplicationFiltersReturnType => {
  return useMemo(() => {
    if (!applications) {
      return {
        uniqueSubcomponents: [],
        uniqueClusters: [],
      };
    }

    const uniqueSubcomponents: string[] = [];
    const uniqueClusters: string[] = [];

    applications.forEach(application => {
      const subcomponentName = application.subcomponent.name;
      const clusterName = application.cluster.name;

      if (subcomponentName) uniqueSubcomponents.push(subcomponentName);
      if (clusterName) uniqueClusters.push(clusterName);
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
    };
  }, [applications, hasSubcomponents]);
};
