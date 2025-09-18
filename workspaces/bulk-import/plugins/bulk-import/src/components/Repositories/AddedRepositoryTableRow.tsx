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
import { configApiRef, useApi } from '@backstage/core-plugin-api';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { useFormikContext } from 'formik';

import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ApprovalTool,
  ImportStatus as ImportStatusType,
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

const ImportStatus = ({ data }: { data: AddRepositoryData }) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const status = values.repositories?.[data.id]?.catalogInfoYaml?.status;
  // console.log(`status ${status}`)
  return getImportStatus(
    status as ImportStatusType,
    true,
    values.repositories?.[data.id]?.catalogInfoYaml?.pullRequest as string,
    values?.approvalTool === ApprovalTool.Gitlab,
  );
};

const LastUpdated = ({ data }: { data: AddRepositoryData }) => {
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  return calculateLastUpdated(
    values.repositories?.[data.id]?.catalogInfoYaml?.lastUpdated || '',
  );
};

export const AddedRepositoryTableRow = ({
  data,
  onDelete,
}: {
  data: AddRepositoryData;
  onDelete: (repo: AddRepositoryData) => void;
}) => {
  const classes = useStyles();
  useApi(configApiRef);
  return (
    <TableRow hover>
      <TableCell component="th" scope="row" className={classes.tableCellStyle}>
        <Link
          to={`/bulk-import/repositories/tasks/${encodeURIComponent(
            data.repoUrl || '',
          )}`}
        >
          {data.repoName}
        </Link>
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
        <ImportStatus data={data} />
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        {data.tasks?.map(task => (
          <Typography key={task.taskId} component="span">
            {task.taskId}
          </Typography>
        ))}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        <LastUpdated data={data} />
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        <CatalogInfoAction data={data} />
        <DeleteRepository
          data={data}
          onDelete={() => {
            onDelete(data);
          }}
        />
        <SyncRepository data={data} />
      </TableCell>
    </TableRow>
  );
};
