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

import { ErrorPanel, Table, TableColumn } from '@backstage/core-components';

import { MarketplacePackage } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { usePackages } from '../hooks/usePackages';
import { useQueryTableOptions } from '../hooks/useQueryTableOptions';
import { PackageLink } from './PackageLink';
import {
  mapBackstageRoleToLabel,
  mapPackageInstallStatusToLabel,
} from '../labels';

const columns: TableColumn<MarketplacePackage>[] = [
  {
    title: 'Package name',
    field: 'spec.packageName',
    type: 'string',
    render: pkg => <PackageLink pkg={pkg} />,
  },
  {
    title: 'Version',
    field: 'spec.version',
    type: 'string',
  },
  {
    title: 'Role',
    field: 'spec.backstage.role',
    type: 'string',
    render(data) {
      return (
        (data.spec?.backstage?.role
          ? mapBackstageRoleToLabel[data.spec.backstage.role]
          : undefined) ??
        data.spec?.backstage?.role ??
        '-'
      );
    },
  },
  {
    title: 'Supported version',
    field: 'spec.backstage.supportedVersions',
    type: 'string',
  },
  {
    title: 'Status',
    field: 'spec.installStatus',
    type: 'string',
    render(data) {
      return data.spec?.installStatus
        ? mapPackageInstallStatusToLabel[data.spec.installStatus]
        : '-';
    },
  },
];

export const MarketplacePackagesTable = () => {
  const queryTableOptions = useQueryTableOptions<MarketplacePackage>(columns);

  const packages = usePackages(queryTableOptions.query);

  const emptyContent = packages.error ? (
    <div style={{ padding: 16 }}>
      <ErrorPanel error={packages.error} />
    </div>
  ) : null;

  const title =
    !packages.isLoading && packages.data
      ? `Packages (${packages.data?.totalItems})`
      : `Packages`;

  return (
    <Table
      title={title}
      columns={columns}
      data={packages.data?.items || []}
      emptyContent={emptyContent}
      isLoading={packages.isLoading}
      {...queryTableOptions.tableProps}
      totalCount={packages.data?.totalItems}
    />
  );
};
