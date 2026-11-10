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

import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportFlow,
} from '../../types';
import {
  calculateLastUpdated,
  getImportStatus,
  urlHelper,
} from '../../utils/repository-utils';
import { repositoriesTableCellStyle } from '../AddRepositories/repositoriesTableShared';
import {
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import CatalogInfoAction from './CatalogInfoAction';
import DeleteRepository from './DeleteRepository';
import SyncRepository from './SyncRepository';

const ImportStatusComponent = ({ data }: { data: AddRepositoryData }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AddRepositoriesFormValues>();

  const status =
    (values.repositories?.[data.id]?.catalogInfoYaml?.status as string) ??
    (values.repositories?.[data.id]?.task?.status as string) ??
    (values.repositories?.[data.id]?.workflow?.status as string);
  const taskOrWorkflowId =
    values.repositories?.[data.id]?.workflow?.id ??
    values.repositories?.[data.id]?.task?.id;
  return getImportStatus(
    status,
    (key: string) => t(key as any, {}),
    true,
    values.repositories?.[data.id]?.catalogInfoYaml?.pullRequest as string,
    taskOrWorkflowId,
  );
};

const LastUpdated = ({ data }: { data: AddRepositoryData }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  return calculateLastUpdated(
    values.repositories?.[data.id]?.catalogInfoYaml?.lastUpdated ||
      values.repositories?.[data.id]?.lastUpdated ||
      '',
    (key: string, params?: any) => t(key as any, params),
  );
};

export const AddedRepositoryTableRow = ({
  data,
}: {
  data: AddRepositoryData;
}) => {
  const importFlow = useImportFlow();

  return (
    <tr>
      <th scope="row" style={repositoriesTableCellStyle}>
        {importFlow === ImportFlow.Scaffolder ||
        importFlow === ImportFlow.Orchestrator ? (
          <Link
            to={`/bulk-import/import-history/${encodeURIComponent(
              data.repoUrl || '',
            )}`}
          >
            {data.repoName}
          </Link>
        ) : (
          data.repoName
        )}
      </th>
      <td style={repositoriesTableCellStyle}>
        {data?.repoUrl ? (
          <Link to={data.repoUrl || ''} style={bulkImportExternalLinkLinkStyle}>
            {urlHelper(data.repoUrl || '')}
            <BulkImportExternalLinkIcon />
          </Link>
        ) : (
          <>-</>
        )}
      </td>
      <td style={repositoriesTableCellStyle}>
        {data?.organizationUrl ? (
          <Link
            to={data.organizationUrl || ''}
            style={bulkImportExternalLinkLinkStyle}
          >
            {data.orgName}
            <BulkImportExternalLinkIcon />
          </Link>
        ) : (
          <>-</>
        )}
      </td>
      <td style={repositoriesTableCellStyle}>
        <ImportStatusComponent data={data} />
      </td>

      <td style={repositoriesTableCellStyle}>
        <LastUpdated data={data} />
      </td>
      <td style={repositoriesTableCellStyle}>
        <CatalogInfoAction data={data} />
        <DeleteRepository data={data} />
        <SyncRepository data={data} />
      </td>
    </tr>
  );
};
