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

import { Commit, pipelineRunStatus } from '../../../utils/pipeline-runs';

type Props = {
  commits: Commit[] | undefined;
  hasSubcomponents: boolean;
};

type UseCommitFiltersReturnType = {
  uniqueSubcomponents: string[];
  uniqueClusters: string[];
  uniquePipelineRunStatuses: string[];
};

export const useCommitFilters = ({
  commits,
  hasSubcomponents,
}: Props): UseCommitFiltersReturnType => {
  return useMemo(() => {
    if (!commits) {
      return {
        uniqueSubcomponents: [],
        uniqueClusters: [],
        uniquePipelineRunStatuses: [],
      };
    }

    const uniqueSubcomponents: string[] = [];
    const uniqueClusters: string[] = [];
    const uniquePipelineRunStatuses: string[] = [];

    commits.forEach(commit => {
      const subcomponentName = commit.subcomponent.name;
      const clusterName = commit.cluster.name;
      const status = pipelineRunStatus(commit.pipelineRuns[0]);

      if (subcomponentName) uniqueSubcomponents.push(subcomponentName);
      if (clusterName) uniqueClusters.push(clusterName);
      if (status) uniquePipelineRunStatuses.push(status);
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
      uniquePipelineRunStatuses: Array.from(
        new Set(uniquePipelineRunStatuses),
      ).sort((a, b) => a.localeCompare(b)),
    };
  }, [commits, hasSubcomponents]);
};
