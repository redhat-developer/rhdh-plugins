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

import { useEntity } from '@backstage/plugin-catalog-react';
import { useMemo, useState } from 'react';
import { usePipelineruns } from '../../../hooks/resources/usePipelineruns';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import { Commit, PipelineRunType } from '../../../utils/pipeline-runs';
import { getCommitsFromPLRs } from '../../../utils/commits';
import { normalizeFilter } from '../../../utils/filterUtils';
import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';
import TableFilters from '../../Table/TableFilters';
import { CommitItemRow } from './CommitItemRow';
import { useComponents } from '../../../hooks/resources/useComponents';
import {
  PipelineRunLabel,
  FILTER_ALL_VALUE,
  PipelineRunResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { ResourceListContent } from '../../ResourceListContent/ResourceListContent';
import { Entity } from '@backstage/catalog-model';
import {
  useListState,
  useResetPageOnFilterChange,
} from '../../../hooks/useListState';
import { useAllClustersFailed } from '../../../hooks/useAllClustersFailed';
import { useCommitFilters } from './useCommitFilters';

type Props = {
  hasSubcomponents: boolean;
};

type CommitItemRowWithPropsProps = Commit & {
  itemKey: string;
  hasSubcomponents: boolean;
  entity: Entity;
  allPipelineRunsFilteredByComponents: PipelineRunResource[];
};

const CommitItemRowWithProps = (props: CommitItemRowWithPropsProps) => {
  const {
    hasSubcomponents,
    entity,
    itemKey,
    allPipelineRunsFilteredByComponents,
    ...commit
  } = props;
  return (
    <CommitItemRow
      commit={commit}
      hasSubcomponents={hasSubcomponents}
      entity={entity}
      pipelineRuns={allPipelineRunsFilteredByComponents}
    />
  );
};

export const CommitsList = ({ hasSubcomponents }: Props) => {
  const { entity } = useEntity();

  const [selectedSubcomponent, setSelectedSubcomponent] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedCluster, setSelectedCluster] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedCommitStatus, setSelectedCommitStatus] =
    useState<string>(FILTER_ALL_VALUE);
  const [nameSearch, setNameSearch] = useState('');

  const { page, setPage, rowsPerPage, setRowsPerPage } = useListState();

  const {
    data: plrs,
    loaded,
    isFetching,
    error: plrsError,
    clusterErrors: plrsClusterErrors,
    loadMore,
    hasMore,
  } = usePipelineruns();

  const {
    data: components,
    loaded: componentsLoaded,
    error: componentsError,
    clusterErrors: componentsClusterErrors,
  } = useComponents({
    fetchAll: true,
  });

  const componentNames = useMemo(
    () =>
      componentsLoaded && !componentsError
        ? components?.map(c => c.metadata?.name)
        : [],
    [components, componentsLoaded, componentsError],
  );

  const buildPipelineRuns = useMemo(() => {
    return (
      plrs
        ?.filter(
          plr =>
            plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] ===
            PipelineRunType.BUILD,
        )
        ?.filter(plr =>
          componentNames?.includes(
            plr.metadata?.labels?.[PipelineRunLabel.COMPONENT],
          ),
        ) || []
    );
  }, [componentNames, plrs]);

  const commits = useMemo(
    () =>
      (loaded && buildPipelineRuns && getCommitsFromPLRs(buildPipelineRuns)) ||
      [],
    [loaded, buildPipelineRuns],
  );

  // used in CommitListRow to calculate the correct latest PLR status
  const allPipelineRunsFilteredByComponents = useMemo(
    () =>
      plrs?.filter(plr =>
        componentNames?.includes(
          plr.metadata?.labels?.[PipelineRunLabel.COMPONENT],
        ),
      ),
    [componentNames, plrs],
  );

  const { paginatedData, totalCount } = useFilteredPaginatedData(
    commits,
    {
      nameSearch,
      cluster: normalizeFilter(selectedCluster),
      subcomponent: normalizeFilter(selectedSubcomponent),
      commitStatus: normalizeFilter(selectedCommitStatus),
    },
    { page, rowsPerPage },
  );

  const columns = useMemo(() => {
    const c: string[] = [];
    c.push('NAME', 'STATUS', 'APPLICATION');
    if (hasSubcomponents) {
      c.push('SUBCOMPONENT');
    }
    c.push('LAST COMMIT AT', 'BRANCH');
    return c;
  }, [hasSubcomponents]);

  useResetPageOnFilterChange(setPage, [
    selectedSubcomponent,
    selectedCluster,
    selectedCommitStatus,
    nameSearch,
  ]);

  const { uniqueClusters, uniqueSubcomponents, uniquePipelineRunStatuses } =
    useCommitFilters({ commits: commits, hasSubcomponents });

  const data = useMemo<CommitItemRowWithPropsProps[]>(() => {
    if (!paginatedData) return [];
    return paginatedData.map(commit => ({
      ...commit,
      itemKey: commit.metadata?.name,
      hasSubcomponents,
      entity,
      allPipelineRunsFilteredByComponents:
        allPipelineRunsFilteredByComponents ?? [],
    }));
  }, [
    paginatedData,
    hasSubcomponents,
    entity,
    allPipelineRunsFilteredByComponents,
  ]);

  // combine errors from both hooks
  const error = plrsError || componentsError;
  const clusterErrors = [
    ...(plrsClusterErrors || []),
    ...(componentsClusterErrors || []),
  ];

  const allClustersFailed = useAllClustersFailed(
    loaded && componentsLoaded,
    commits,
    clusterErrors,
  );

  if (loaded && componentsLoaded && error) {
    return (
      <InfoCard title="Commits" data-testid="commits-list">
        <ResponseErrorPanel
          error={new Error(error)}
          title="Failed to fetch commits"
        />
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Commits" data-testid="commits-list">
      <TableFilters
        subcomponents={uniqueSubcomponents}
        selectedSubcomponent={selectedSubcomponent}
        onSelectedSubcomponent={setSelectedSubcomponent}
        clusters={uniqueClusters}
        selectedCluster={selectedCluster}
        onSelectedCluster={setSelectedCluster}
        pipelineRunStatuses={uniquePipelineRunStatuses}
        selectedPipelineRunStatus={selectedCommitStatus}
        onSelectedPipelineRunStatus={setSelectedCommitStatus}
        nameSearch={nameSearch}
        onNameSearch={setNameSearch}
        nameSearchPlaceholder="Search by commit sha"
        isFetching={isFetching}
      />

      <ResourceListContent
        loaded={loaded && componentsLoaded}
        allClustersFailed={allClustersFailed}
        clusterErrors={clusterErrors}
        data={data}
        emptyStateTitle="No commits found"
        emptyStateDescription="No commits match the current filters."
        isFetching={isFetching}
        columns={columns}
        ItemRow={CommitItemRowWithProps}
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
