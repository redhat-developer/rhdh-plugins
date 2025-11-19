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

import {
  getApplicationFromResource,
  PipelineRunLabel,
  PipelineRunResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { pipelineRunStatus } from '../../../utils/pipeline-runs';

type Props = {
  pipelineRuns: PipelineRunResource[] | undefined;
  hasSubcomponents: boolean;
};

type UsePipelineRunFiltersReturnType = {
  uniqueSubcomponents: string[];
  uniqueClusters: string[];
  uniqueApplications: string[];
  uniquePipelineRunStatuses: string[];
  uniquePipelineRunTypes: string[];
};

export const usePipelineRunFilters = ({
  pipelineRuns,
  hasSubcomponents,
}: Props): UsePipelineRunFiltersReturnType => {
  return useMemo(() => {
    if (!pipelineRuns) {
      return {
        uniqueSubcomponents: [],
        uniqueClusters: [],
        uniqueApplications: [],
        uniquePipelineRunStatuses: [],
        uniquePipelineRunTypes: [],
      };
    }

    const uniqueSubcomponents: string[] = [];
    const uniqueClusters: string[] = [];
    const uniqueApplications: string[] = [];
    const uniquePipelineRunStatuses: string[] = [];
    const uniquePipelineRunTypes: string[] = [];

    pipelineRuns.forEach(plr => {
      const subcomponentName = plr.subcomponent.name;
      const clusterName = plr.cluster.name;
      const applicationName = getApplicationFromResource(plr);
      const status = pipelineRunStatus(plr);
      const type = plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];

      if (subcomponentName) uniqueSubcomponents.push(subcomponentName);
      if (clusterName) uniqueClusters.push(clusterName);
      if (applicationName) uniqueApplications.push(applicationName);
      if (status) uniquePipelineRunStatuses.push(status);
      if (type) uniquePipelineRunTypes.push(type);
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
      uniquePipelineRunStatuses: Array.from(
        new Set(uniquePipelineRunStatuses),
      ).sort((a, b) => a.localeCompare(b)),
      uniquePipelineRunTypes: Array.from(new Set(uniquePipelineRunTypes)).sort(
        (a, b) => a.localeCompare(b),
      ),
    };
  }, [pipelineRuns, hasSubcomponents]);
};
