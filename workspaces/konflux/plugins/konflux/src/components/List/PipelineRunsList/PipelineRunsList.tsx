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
import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';
import { useMemo, useState } from 'react';
import { usePipelineruns } from '../../../hooks/resources/usePipelineruns';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import { useEntity } from '@backstage/plugin-catalog-react';
import TableFilters from '../../Table/TableFilters';
import { PipelineRunItemRow } from './PipelineRunItemRow';
import { normalizeFilter } from '../../../utils/filterUtils';
import { ResourceListContent } from '../../ResourceListContent/ResourceListContent';
import {
  PipelineRunResource,
  FILTER_ALL_VALUE,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import {
  useListState,
  useResetPageOnFilterChange,
} from '../../../hooks/useListState';
import { useAllClustersFailed } from '../../../hooks/useAllClustersFailed';
import { createItemKey } from '../../../utils/resourceUtils';
import { usePipelineRunFilters } from './usePipelineRunFilters';

type PipelineRunsListProps = {
  hasSubcomponents?: boolean;
};

type PipelineRunItemRowWithPropsProps = PipelineRunResource & {
  itemKey: string;
  hasSubcomponents: boolean;
  entity: Entity;
};

const PipelineRunItemRowWithProps = (
  props: PipelineRunItemRowWithPropsProps,
) => {
  const { hasSubcomponents, entity, itemKey, ...pipelineRun } = props;
  return (
    <PipelineRunItemRow
      pipelineRun={pipelineRun}
      hasSubcomponents={hasSubcomponents}
      entity={entity}
    />
  );
};

export const PipelineRunsList: React.FC<PipelineRunsListProps> = ({
  hasSubcomponents = true,
}) => {
  const { entity } = useEntity();
  const [selectedSubcomponent, setSelectedSubcomponent] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedCluster, setSelectedCluster] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedApplication, setSelectedApplication] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedPipelineRunStatus, setSelectedPipelineRunStatus] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedPipelineRunType, setSelectedPipelineRunType] =
    useState<string>(FILTER_ALL_VALUE);
  const [nameSearch, setNameSearch] = useState('');

  const { page, setPage, rowsPerPage, setRowsPerPage } = useListState();

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

  useResetPageOnFilterChange(setPage, [
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

  const data = useMemo<PipelineRunItemRowWithPropsProps[]>(() => {
    if (!paginatedData) return [];
    return paginatedData.map(plr => ({
      ...plr,
      itemKey: createItemKey(plr),
      hasSubcomponents,
      entity,
    }));
  }, [paginatedData, hasSubcomponents, entity]);

  const allClustersFailed = useAllClustersFailed(loaded, plrs, clusterErrors);

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

      <ResourceListContent
        loaded={loaded}
        allClustersFailed={allClustersFailed}
        clusterErrors={clusterErrors}
        data={data}
        emptyStateTitle="No pipeline runs found"
        emptyStateDescription="No pipeline runs match the current filters."
        isFetching={isFetching}
        columns={columns}
        ItemRow={PipelineRunItemRowWithProps}
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
    </InfoCard>
  );
};
