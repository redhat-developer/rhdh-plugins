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

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { makeStyles } from '@mui/styles';
import { useFormikContext } from 'formik';

import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ApprovalTool,
} from '../../types';
import {
  calculateLastUpdated,
  getImportStatus,
  urlHelper,
} from '../../utils/repository-utils';
import CatalogInfoAction from './CatalogInfoAction';
import DeleteRepository from './DeleteRepository';
import SyncRepository from './SyncRepository';

const useStyles = makeStyles(() => ({
  tableCellStyle: {
    lineHeight: '1.5rem',
    fontSize: '0.875rem',
  },
}));

const ImportStatusComponent = ({ data }: { data: AddRepositoryData }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const status =
    (values.repositories?.[data.id]?.catalogInfoYaml?.status as string) ??
    (values.repositories?.[data.id]?.task?.status as string);
  return getImportStatus(
    status,
    (key: string) => t(key as any, {}),
    true,
    values.repositories?.[data.id]?.catalogInfoYaml?.pullRequest as string,
    values.repositories?.[data.id]?.task?.id,
    values?.approvalTool === ApprovalTool.Gitlab,
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
  const classes = useStyles();
  const importFlow = useImportFlow();
  return (
    <TableRow hover>
      <TableCell component="th" scope="row" className={classes.tableCellStyle}>
        {importFlow === 'scaffolder' ? (
          <Link
            to={`/bulk-import/repositories/tasks/${encodeURIComponent(
              data.repoUrl || '',
            )}`}
          >
            {data.repoName}
          </Link>
        ) : (
          data.repoName
        )}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        {data?.repoUrl ? (
          <Link to={data.repoUrl || ''}>
            {urlHelper(data.repoUrl || '')}
            <OpenInNewIcon
              style={{ verticalAlign: 'sub', paddingTop: '7px' }}
            />
          </Link>
        ) : (
          <>-</>
        )}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        {data?.organizationUrl ? (
          <Link to={data.organizationUrl || ''}>
            {data.orgName}
            <OpenInNewIcon
              style={{ verticalAlign: 'sub', paddingTop: '7px' }}
            />
          </Link>
        ) : (
          <>-</>
        )}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        <ImportStatusComponent data={data} />
      </TableCell>

      <TableCell align="left" className={classes.tableCellStyle}>
        <LastUpdated data={data} />
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        <CatalogInfoAction data={data} />
        <DeleteRepository data={data} />
        <SyncRepository data={data} />
      </TableCell>
    </TableRow>
  );
};
