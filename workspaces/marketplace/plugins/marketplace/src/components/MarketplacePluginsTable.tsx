/*
 * Copyright The Backstage Authors
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

import React from 'react';

import { ErrorPanel, Table, TableColumn } from '@backstage/core-components';

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { useQueryTableOptions } from '../hooks/useQueryTableOptions';
import { usePlugins } from '../hooks/usePlugins';

import { PluginIcon } from './PluginIcon';
import { PluginLink } from './PluginLink';

const columns: TableColumn<MarketplacePlugin>[] = [
  {
    sorting: false,
    width: '40px',
    render: plugin => <PluginIcon plugin={plugin} size={40} />,
  },
  {
    title: 'Name',
    field: 'metadata.title',
    type: 'string',
    render: plugin => <PluginLink plugin={plugin} />,
  },
  {
    title: 'Description',
    field: 'metadata.description',
    type: 'string',
  },
];

export const MarketplacePluginsTable = () => {
  const queryTableOptions = useQueryTableOptions<MarketplacePlugin>(columns);

  const plugins = usePlugins(queryTableOptions.query);

  const emptyContent = plugins.error ? (
    <div style={{ padding: 16 }}>
      <ErrorPanel error={plugins.error} />
    </div>
  ) : null;

  const title =
    !plugins.isLoading && plugins.data
      ? `Plugins (${plugins.data?.totalItems})`
      : `Plugins`;

  return (
    <Table
      title={title}
      columns={columns}
      data={plugins.data?.items || []}
      emptyContent={emptyContent}
      isLoading={plugins.isLoading}
      {...queryTableOptions.tableProps}
      totalCount={plugins.data?.totalItems}
    />
  );
};
