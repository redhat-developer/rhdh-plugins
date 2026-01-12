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

import { ExtensionsPackage } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { usePackages } from '../hooks/usePackages';
import { useQueryTableOptions } from '../hooks/useQueryTableOptions';
import { PackageLink } from './PackageLink';
import {
  mapBackstageRoleToLabel,
  mapPackageInstallStatusToLabel,
} from '../labels';
import { useTranslation } from '../hooks/useTranslation';

export const ExtensionsPackagesTable = () => {
  const { t } = useTranslation();

  const columns: TableColumn<ExtensionsPackage>[] = [
    {
      title: t('table.packageName'),
      field: 'spec.packageName',
      type: 'string',
      render: pkg => <PackageLink pkg={pkg} />,
    },
    {
      title: t('table.version'),
      field: 'spec.version',
      type: 'string',
    },
    {
      title: t('table.role'),
      field: 'spec.backstage.role',
      type: 'string',
      render(data) {
        return (
          (data.spec?.backstage?.role
            ? mapBackstageRoleToLabel(data.spec.backstage.role, t)
            : undefined) ??
          data.spec?.backstage?.role ??
          '-'
        );
      },
    },
    {
      title: t('table.supportedVersion'),
      field: 'spec.backstage.supportedVersions',
      type: 'string',
    },
    {
      title: t('table.status'),
      field: 'spec.installStatus',
      type: 'string',
      render(data) {
        return data.spec?.installStatus
          ? mapPackageInstallStatusToLabel(data.spec.installStatus, t)
          : '-';
      },
    },
  ];

  const queryTableOptions = useQueryTableOptions<ExtensionsPackage>(columns);

  const packages = usePackages(queryTableOptions.query);

  const emptyContent = packages.error ? (
    <div style={{ padding: 16 }}>
      <ErrorPanel error={packages.error} />
    </div>
  ) : null;

  const title =
    !packages.isLoading && packages.data
      ? t('table.packagesCount' as any, {
          count: packages.data?.totalItems?.toString(),
        })
      : t('table.packages');

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
