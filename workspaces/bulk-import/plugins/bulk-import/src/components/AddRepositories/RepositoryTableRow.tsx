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

import type { MouseEvent } from 'react';

import { Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { makeStyles } from '@mui/styles';
import { useQuery } from '@tanstack/react-query';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import {
  AddRepositoryData,
  ImportJobStatus,
  RepositoryStatus,
  TaskStatus,
} from '../../types';
import { urlHelper } from '../../utils/repository-utils';
import { CatalogInfoStatus } from './CatalogInfoStatus';

const useStyles = makeStyles(() => ({
  tableCellStyle: {
    lineHeight: '1.5rem',
    fontSize: '0.875rem',
    padding: '15px 16px 15px 6px',
  },
}));

export const RepositoryTableRow = ({
  handleClick,
  isItemSelected,
  data,
  isDrawer = false,
}: {
  handleClick: (_event: MouseEvent, id: AddRepositoryData) => void;
  isItemSelected: boolean;
  data: AddRepositoryData;
  isDrawer?: boolean;
}) => {
  const classes = useStyles();
  const bulkImportApi = useApi(bulkImportApiRef);

  const { data: value, isLoading: loading } = useQuery(
    [
      'importAction',
      data.repoUrl,
      data?.defaultBranch,
      data && (data as ImportJobStatus).approvalTool,
    ],
    async () => {
      if (data.repoUrl) {
        const result = await bulkImportApi.getImportAction(
          data.repoUrl,
          data?.defaultBranch || 'main',
          data && (data as ImportJobStatus).approvalTool,
        );
        return result;
      }
      return null;
    },
    {
      enabled: !!data.repoUrl,
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchInterval: 60000, // Auto-refetch every minute
    },
  );

  return (
    <TableRow
      hover
      aria-checked={isItemSelected}
      tabIndex={-1}
      key={data.id}
      selected={isItemSelected}
    >
      <TableCell
        component="th"
        scope="row"
        padding="none"
        className={classes.tableCellStyle}
      >
        <Checkbox
          disableRipple
          color="primary"
          checked={
            value?.status === RepositoryStatus.ADDED ||
            value?.status === RepositoryStatus.WAIT_PR_APPROVAL ||
            value?.status === TaskStatus.Processing ||
            value?.status === TaskStatus.Completed
              ? true
              : isItemSelected
          }
          disabled={
            loading ||
            value?.status === RepositoryStatus.ADDED ||
            value?.status === RepositoryStatus.WAIT_PR_APPROVAL ||
            value?.status === TaskStatus.Processing ||
            value?.status === TaskStatus.Completed
          }
          onClick={event => handleClick(event, data)}
          style={{ padding: '0 12px' }}
        />
        {data.repoName}
      </TableCell>
      <TableCell align="left" className={classes.tableCellStyle}>
        {data.repoUrl ? (
          <Link to={data.repoUrl}>
            {urlHelper(data.repoUrl)}
            <OpenInNewIcon
              style={{ verticalAlign: 'sub', paddingTop: '7px' }}
            />
          </Link>
        ) : (
          <>-</>
        )}
      </TableCell>
      {!isDrawer && (
        <TableCell align="left" className={classes.tableCellStyle}>
          {data?.organizationUrl ? (
            <Link to={data.organizationUrl}>
              {data.orgName}
              <OpenInNewIcon
                style={{ verticalAlign: 'sub', paddingTop: '7px' }}
              />
            </Link>
          ) : (
            <>-</>
          )}
        </TableCell>
      )}

      <TableCell align="left" className={classes.tableCellStyle}>
        <CatalogInfoStatus
          data={data}
          importStatus={value?.status as string}
          isLoading={loading}
          isItemSelected={isItemSelected}
          isDrawer={isDrawer}
          taskId={(value as ImportJobStatus)?.task?.taskId}
          prUrl={
            (value as ImportJobStatus)?.github?.pullRequest?.url ||
            (value as ImportJobStatus)?.gitlab?.pullRequest?.url
          }
        />
      </TableCell>
    </TableRow>
  );
};
