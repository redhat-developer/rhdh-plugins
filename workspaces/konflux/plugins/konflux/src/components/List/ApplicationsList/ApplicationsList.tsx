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
import { useMemo, useEffect, useState } from 'react';
import { useApplications } from '../../../hooks/resources/useApplications';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import { useEntity } from '@backstage/plugin-catalog-react';
import TableFilters from '../../Table/TableFilters';
import { ApplicationItemRow } from './ApplicationItemRow';
import { useApplicationFilters } from './useApplicationFilters';
import { normalizeFilter } from '../../../utils/filterUtils';
import { ResourceListContent } from '../../ResourceListContent/ResourceListContent';
import { ApplicationResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';

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
  const [selectedSubcomponent, setSelectedSubcomponent] = useState('All');
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [nameSearch, setNameSearch] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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

  // reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedSubcomponent, selectedCluster, nameSearch]);

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
      itemKey: `${application.metadata?.name}-${application.metadata?.namespace}-${application.cluster.name}`,
      hasSubcomponents,
      entity,
    }));
  }, [paginatedData, hasSubcomponents, entity]);

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

  // show cluster errors only when all clusters failed
  const allClustersFailed =
    loaded &&
    (!applications || applications.length === 0) &&
    clusterErrors &&
    clusterErrors.length > 0;

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
