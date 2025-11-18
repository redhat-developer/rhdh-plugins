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
import { useApplications } from '../../../hooks/resources/useApplications';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import { useEntity } from '@backstage/plugin-catalog-react';
import TableFilters from '../../Table/TableFilters';
import { ApplicationItemRow } from './ApplicationItemRow';
import { normalizeFilter } from '../../../utils/filterUtils';
import { ResourceListContent } from '../../ResourceListContent/ResourceListContent';
import {
  ApplicationResource,
  FILTER_ALL_VALUE,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import {
  useListState,
  useResetPageOnFilterChange,
} from '../../../hooks/useListState';
import { useAllClustersFailed } from '../../../hooks/useAllClustersFailed';
import { createItemKey } from '../../../utils/resourceUtils';
import { useApplicationFilters } from './useApplicationFilters';

type ApplicationsListProps = {
  hasSubcomponents?: boolean;
};

type ApplicationItemRowWithPropsProps = ApplicationResource & {
  itemKey: string;
  hasSubcomponents: boolean;
  entity: Entity;
};

const ApplicationItemRowWithProps = (
  props: ApplicationItemRowWithPropsProps,
) => {
  const { hasSubcomponents, entity, itemKey, ...application } = props;
  return (
    <ApplicationItemRow
      application={application}
      hasSubcomponents={hasSubcomponents}
      entity={entity}
    />
  );
};

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  hasSubcomponents = true,
}) => {
  const { entity } = useEntity();
  const [selectedSubcomponent, setSelectedSubcomponent] =
    useState<string>(FILTER_ALL_VALUE);
  const [selectedCluster, setSelectedCluster] =
    useState<string>(FILTER_ALL_VALUE);
  const [nameSearch, setNameSearch] = useState('');

  const { page, setPage, rowsPerPage, setRowsPerPage } = useListState();

  const {
    data: applications,
    loaded,
    isFetching,
    error,
    clusterErrors,
    loadMore,
    hasMore,
  } = useApplications();

  const { paginatedData, totalCount } = useFilteredPaginatedData(
    applications,
    {
      nameSearch,
      subcomponent: normalizeFilter(selectedSubcomponent),
      cluster: normalizeFilter(selectedCluster),
    },
    { page, rowsPerPage },
  );

  useResetPageOnFilterChange(setPage, [
    selectedSubcomponent,
    selectedCluster,
    nameSearch,
  ]);

  const { uniqueSubcomponents, uniqueClusters } = useApplicationFilters({
    applications,
    hasSubcomponents,
  });

  const columns = useMemo(() => {
    const c: string[] = [];
    c.push('NAME');
    if (hasSubcomponents) {
      c.push('SUBCOMPONENT');
    }
    c.push('NAMESPACE', 'CLUSTER');
    return c;
  }, [hasSubcomponents]);

  const data = useMemo(() => {
    if (!paginatedData) return [];
    return paginatedData.map(application => ({
      ...application,
      itemKey: createItemKey(application),
      hasSubcomponents,
      entity,
    }));
  }, [paginatedData, hasSubcomponents, entity]);

  const allClustersFailed = useAllClustersFailed(
    loaded,
    applications,
    clusterErrors,
  );

  if (loaded && error) {
    return (
      <InfoCard title="Applications">
        <ResponseErrorPanel
          error={new Error(error)}
          title="Failed to fetch applications"
        />
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Applications">
      <TableFilters
        subcomponents={uniqueSubcomponents}
        selectedSubcomponent={selectedSubcomponent}
        onSelectedSubcomponent={setSelectedSubcomponent}
        clusters={uniqueClusters}
        selectedCluster={selectedCluster}
        onSelectedCluster={setSelectedCluster}
        nameSearch={nameSearch}
        onNameSearch={setNameSearch}
        nameSearchPlaceholder="Search by application name"
        isFetching={isFetching}
      />

      <ResourceListContent
        loaded={loaded}
        allClustersFailed={!!allClustersFailed}
        clusterErrors={clusterErrors}
        data={data}
        emptyStateTitle="No applications found"
        emptyStateDescription="No applications match the current filters."
        isFetching={isFetching}
        columns={columns}
        ItemRow={ApplicationItemRowWithProps}
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
