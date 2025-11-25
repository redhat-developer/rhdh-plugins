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
import { useComponents } from '../../../hooks/resources/useComponents';
import { useFilteredPaginatedData } from '../../../hooks/useFilteredPaginatedData';
import TableFilters from '../../Table/TableFilters';
import { ComponentItemRow } from './ComponentItemRow';
import { useComponentFilters } from './useComponentFilters';
import { normalizeFilter } from '../../../utils/filterUtils';
import { ResourceListContent } from '../../ResourceListContent/ResourceListContent';
import { ComponentResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

type Props = {
  hasSubcomponents: boolean;
};

type ComponentItemRowWithPropsProps = ComponentResource & {
  itemKey: string;
};

const ComponentItemRowWithProps = (props: ComponentItemRowWithPropsProps) => {
  const { itemKey, ...component } = props;
  return <ComponentItemRow component={component} />;
};

export const ComponentsList = ({ hasSubcomponents }: Props) => {
  const [selectedSubcomponent, setSelectedSubcomponent] = useState('All');
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [selectedApplication, setSelectedApplication] = useState('All');
  const [nameSearch, setNameSearch] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    data: components,
    loaded,
    isFetching,
    error,
    clusterErrors,
    loadMore,
    hasMore,
  } = useComponents();

  const { paginatedData, totalCount } = useFilteredPaginatedData(
    components,
    {
      nameSearch,
      cluster: normalizeFilter(selectedCluster),
      subcomponent: normalizeFilter(selectedSubcomponent),
      application: normalizeFilter(selectedApplication),
    },
    { page, rowsPerPage },
  );

  // reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedSubcomponent, selectedCluster, nameSearch, selectedApplication]);

  const { uniqueSubcomponents, uniqueClusters, uniqueApplications } =
    useComponentFilters({ components, hasSubcomponents });

  const data = useMemo<ComponentItemRowWithPropsProps[]>(() => {
    if (!paginatedData) return [];
    return paginatedData.map(component => ({
      ...component,
      itemKey: `${component.metadata?.name}-${component.metadata?.namespace}-${component.cluster.name}`,
    }));
  }, [paginatedData]);

  if (loaded && error) {
    return (
      <InfoCard title="Components">
        <ResponseErrorPanel
          error={new Error(error)}
          title="Failed to fetch components"
        />
      </InfoCard>
    );
  }

  // show cluster errors only when all clusters failed
  const allClustersFailed =
    loaded &&
    (!components || components.length === 0) &&
    clusterErrors &&
    clusterErrors.length > 0;

  return (
    <InfoCard title="Components">
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
        nameSearch={nameSearch}
        onNameSearch={setNameSearch}
        nameSearchPlaceholder="Search by component name"
        isFetching={isFetching}
      />

      <ResourceListContent
        loaded={loaded}
        allClustersFailed={!!allClustersFailed}
        clusterErrors={clusterErrors}
        data={data}
        emptyStateTitle="No components found"
        emptyStateDescription="No components match the current filters."
        isFetching={isFetching}
        columns={['NAME', 'APPLICATION', 'CLUSTER', 'NAMESPACE']}
        ItemRow={ComponentItemRowWithProps}
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
