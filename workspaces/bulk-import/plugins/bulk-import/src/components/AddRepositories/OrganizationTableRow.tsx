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

import { Link } from '@backstage/core-components';

import { useFormikContext } from 'formik';

import { AddRepositoriesFormValues, AddRepositoryData } from '../../types';
import { urlHelper } from '../../utils/repository-utils';
import {
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { CatalogInfoStatus } from './CatalogInfoStatus';
import { repositoriesTableOrgCellStyle } from './repositoriesTableShared';
import { SelectRepositories } from './SelectRepositories';

export const OrganizationTableRow = ({
  onOrgRowSelected,
  data,
}: {
  onOrgRowSelected: (org: AddRepositoryData) => void;
  data: AddRepositoryData;
}) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const alreadyAdded = Object.values(values?.excludedRepositories || {}).filter(
    r => r.orgName === data.orgName,
  ).length;

  return (
    <tr>
      <th scope="row" style={repositoriesTableOrgCellStyle}>
        {data.orgName}
      </th>
      <td style={repositoriesTableOrgCellStyle}>
        <Link
          to={data?.organizationUrl || ''}
          style={bulkImportExternalLinkLinkStyle}
        >
          {urlHelper(data?.organizationUrl || '')}
          <BulkImportExternalLinkIcon size={14} />
        </Link>
      </td>
      <td style={repositoriesTableOrgCellStyle}>
        <SelectRepositories
          onOrgRowSelected={onOrgRowSelected}
          orgData={data}
          addedRepositoriesCount={alreadyAdded}
        />
      </td>
      <td style={repositoriesTableOrgCellStyle}>
        <CatalogInfoStatus data={data} alreadyAdded={alreadyAdded} />
      </td>
    </tr>
  );
};
