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

import { Progress } from '@backstage/core-components';
import { ClusterError } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { ItemWithKey, Pagination, Table } from '../Table/Table';
import { ClusterErrorPanel, EmptyState } from '../common';

type ResourceListContentProps<T extends ItemWithKey> = {
  loaded: boolean;
  allClustersFailed: boolean;
  data: T[];
  clusterErrors?: ClusterError[];
  emptyStateTitle: string;
  emptyStateDescription: string;
  isFetching?: boolean;
  columns: string[];
  ItemRow: React.ComponentType<T>;
  pagination?: Pagination;
  onLoadMore?: () => void | Promise<void>;
  hasMore?: boolean;
};

export const ResourceListContent = <T extends ItemWithKey>({
  loaded,
  allClustersFailed,
  data,
  clusterErrors,
  emptyStateTitle,
  emptyStateDescription,
  isFetching,
  columns,
  ItemRow,
  pagination,
  onLoadMore,
  hasMore,
}: ResourceListContentProps<T>) => {
  if (!loaded) {
    return <Progress />;
  }
  if (allClustersFailed && clusterErrors) {
    return <ClusterErrorPanel errors={clusterErrors} />;
  }
  if (data.length === 0) {
    return (
      <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
    );
  }
  return (
    <Table
      isFetching={isFetching}
      columns={columns}
      data={data}
      ItemRow={ItemRow}
      pagination={pagination}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
    />
  );
};
