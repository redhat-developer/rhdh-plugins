/* eslint-disable no-nested-ternary */
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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';
import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useMemo, useEffect, useState } from 'react';
import { Table } from '../../Table';
import { usePipelineruns } from '../../../hooks/resources/usePipelineruns';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import { useEntity } from '@backstage/plugin-catalog-react';
import TableFilters from '../../Table/TableFilters';
import { PipelineRunItemRow } from './PipelineRunItemRow';
import { usePipelineRunFilters } from './usePipelineRunFilters';
import { ClusterErrorPanel } from '../../common/ClusterErrorPanel';
import { EmptyState } from '../../common/EmptyState';
import { normalizeFilter } from '../../../utils/filterUtils';

type PipelineRunsListProps = {
  hasSubcomponents?: boolean;
};
export const PipelineRunsList: React.FC<PipelineRunsListProps> = ({
  hasSubcomponents = true,
}) => {
  const { entity } = useEntity();
  const [selectedSubcomponent, setSelectedSubcomponent] = useState('All');
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [selectedApplication, setSelectedApplication] = useState('All');
  const [selectedPipelineRunStatus, setSelectedPipelineRunStatus] =
    useState('All');
  const [selectedPipelineRunType, setSelectedPipelineRunType] = useState('All');
  const [nameSearch, setNameSearch] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    data: plrs,
    loaded,
    isFetching,
    error,
    clusterErrors,
    loadMore,
    hasMore,
  } = usePipelineruns();

  const { paginatedData, totalCount } = useFilteredPaginatedData(
    plrs,
    {
      nameSearch,
      cluster: normalizeFilter(selectedCluster),
      subcomponent: normalizeFilter(selectedSubcomponent),
      application: normalizeFilter(selectedApplication),
      pipelineRunStatus: normalizeFilter(selectedPipelineRunStatus),
      pipelineRunType: normalizeFilter(selectedPipelineRunType),
    },
    { page, rowsPerPage },
  );

  // reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [
    selectedSubcomponent,
    selectedCluster,
    selectedApplication,
    selectedPipelineRunStatus,
    selectedPipelineRunType,
    nameSearch,
  ]);

  const {
    uniqueClusters,
    uniqueSubcomponents,
    uniqueApplications,
    uniquePipelineRunStatuses,
    uniquePipelineRunTypes,
  } = usePipelineRunFilters({ pipelineRuns: plrs, hasSubcomponents });

  const columns = useMemo(() => {
    const c: string[] = [];
    c.push('NAME', 'STATUS', 'TYPE');
    if (hasSubcomponents) {
      c.push('SUBCOMPONENT');
    }
    c.push('STARTED', 'TRIGGER', 'REFERENCE', 'DURATION');
    return c;
  }, [hasSubcomponents]);

  const data = useMemo(() => {
    if (!paginatedData) return [];
    return paginatedData.map(plr => ({
      ...plr,
      itemKey: `${plr.metadata?.name}-${plr.metadata?.namespace}-${plr?.cluster.name}`,
    }));
  }, [paginatedData]);

  if (loaded && error) {
    return (
      <InfoCard title="Pipeline Runs" data-testid="pipeline-runs-list">
        <ResponseErrorPanel
          error={new Error(error)}
          title="Failed to fetch pipeline runs"
        />
      </InfoCard>
    );
  }

  // show cluster errors only when all clusters failed
  const allClustersFailed =
    loaded &&
    (!plrs || plrs.length === 0) &&
    clusterErrors &&
    clusterErrors.length > 0;

  return (
    <InfoCard title="Pipeline Runs" data-testid="pipeline-runs-list">
      <TableFilters
        subcomponents={uniqueSubcomponents}
        selectedSubcomponent={selectedSubcomponent}
        onSelectedSubcomponent={setSelectedSubcomponent}
        clusters={uniqueClusters}
        selectedCluster={selectedCluster}
        onSelectedCluster={setSelectedCluster}
        applications={uniqueApplications}
        selectedApplication={selectedApplication}
        onSelectedApplication={setSelectedApplication}
        pipelineRunStatuses={uniquePipelineRunStatuses}
        selectedPipelineRunStatus={selectedPipelineRunStatus}
        onSelectedPipelineRunStatus={setSelectedPipelineRunStatus}
        pipelineRunTypes={uniquePipelineRunTypes}
        selectedPipelineRunType={selectedPipelineRunType}
        onSelectedPipelineRunType={setSelectedPipelineRunType}
        nameSearch={nameSearch}
        onNameSearch={setNameSearch}
        nameSearchPlaceholder="Search by pipeline run name"
        isFetching={isFetching}
      />

      {(() => {
        if (!loaded) {
          return <Progress />;
        }
        if (allClustersFailed) {
          return <ClusterErrorPanel errors={clusterErrors} />;
        }
        if (data.length === 0) {
          return (
            <EmptyState
              title="No pipeline runs found"
              description="No pipeline runs match the current filters."
            />
          );
        }
        return (
          <Table
            isFetching={isFetching}
            columns={columns}
            data={data}
            ItemRow={pipelineRun => (
              <PipelineRunItemRow
                pipelineRun={pipelineRun}
                hasSubcomponents={hasSubcomponents}
                entity={entity}
              />
            )}
            pagination={{
              page,
              totalCount,
              setPage,
              rowsPerPage,
              setRowsPerPage,
            }}
            onLoadMore={hasMore ? loadMore : undefined}
            hasMore={hasMore}
          />
        );
      })()}
    </InfoCard>
  );
};
