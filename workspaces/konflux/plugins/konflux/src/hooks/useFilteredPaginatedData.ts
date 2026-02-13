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
  PipelineRunLabel,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { useMemo } from 'react';
import { pipelineRunStatus } from '../utils/pipeline-runs';

export function useFilteredPaginatedData<
  T extends K8sResourceCommonWithClusterInfo,
>(
  data: T[] | undefined,
  filters: {
    nameSearch?: string;
    cluster?: string;
    subcomponent?: string;
    application?: string;
    pipelineRunStatus?: string;
    commitStatus?: string;
    pipelineRunType?: string;
  },
  pagination: {
    page: number;
    rowsPerPage: number;
  },
) {
  const filteredData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    if (filters.nameSearch) {
      result = result.filter((item: any) =>
        item.metadata?.name
          ?.toLowerCase()
          .includes(filters.nameSearch?.toLowerCase()),
      );
    }

    if (filters.cluster) {
      result = result.filter(
        (item: any) => item.cluster?.name === filters.cluster,
      );
    }

    if (filters.subcomponent) {
      result = result.filter(
        (item: any) => item.subcomponent?.name === filters.subcomponent,
      );
    }

    if (filters.application) {
      result = result.filter((item: any) => {
        const applicationName = getApplicationFromResource(item);
        return applicationName === filters.application;
      });
    }

    if (filters.pipelineRunStatus) {
      result = result.filter((item: any) => {
        const status = pipelineRunStatus(item);
        return status === filters.pipelineRunStatus;
      });
    }

    if (filters.pipelineRunType) {
      result = result.filter((item: any) => {
        const type = item.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
        return type === filters.pipelineRunType;
      });
    }

    if (filters.commitStatus) {
      result = result.filter((item: any) => {
        const status = pipelineRunStatus(item.pipelineRuns?.[0]);
        return status === filters.commitStatus;
      });
    }

    return result;
  }, [data, filters]);

  const paginatedData = useMemo(() => {
    const start = pagination.page * pagination.rowsPerPage;
    return filteredData.slice(start, start + pagination.rowsPerPage);
  }, [filteredData, pagination.page, pagination.rowsPerPage]);

  return {
    filteredData,
    paginatedData,
    totalCount: filteredData.length,
    totalPages: Math.ceil(filteredData.length / pagination.rowsPerPage),
  };
}
