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

import { useRef } from 'react';
import type { MouseEvent } from 'react';

import { Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Checkbox, Flex } from '@backstage/ui';

import { useQuery } from '@tanstack/react-query';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import {
  AddRepositoryData,
  ImportJobStatus,
  RepositoryStatus,
  TaskStatus,
  WorkflowStatus,
} from '../../types';
import { urlHelper } from '../../utils/repository-utils';
import {
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { CatalogInfoStatus } from './CatalogInfoStatus';
import { repositoriesTableCellStyle } from './repositoriesTableShared';

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
  const bulkImportApi = useApi(bulkImportApiRef);
  const startTimeRef = useRef(Date.now());

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
      refetchInterval: queryData => {
        const status = (queryData as ImportJobStatus | null)?.status;
        const isActiveTask =
          status === TaskStatus.Processing ||
          status === WorkflowStatus.Active ||
          status === WorkflowStatus.Pending;

        if (isActiveTask) {
          return 10000; // Poll every 10s for active tasks
        }

        // Calculate time until next 60-second aligned interval
        const elapsed = Date.now() - startTimeRef.current;
        const intervalMs = 60000;
        const remainder = elapsed % intervalMs;
        // If exactly at boundary, wait full interval; otherwise wait until next boundary
        return remainder === 0 ? intervalMs : intervalMs - remainder;
      },
      refetchOnWindowFocus: false,
    },
  );

  const importStatus = value as ImportJobStatus;
  let importId = '';
  if (importStatus?.task) {
    importId = importStatus.task.taskId;
  }
  if (importStatus?.workflow) {
    importId = importStatus.workflow.workflowId;
  }

  const isChecked =
    value?.status === RepositoryStatus.ADDED ||
    value?.status === RepositoryStatus.WAIT_PR_APPROVAL ||
    value?.status === TaskStatus.Processing ||
    value?.status === TaskStatus.Completed ||
    value?.status === WorkflowStatus.Active ||
    value?.status === WorkflowStatus.Pending ||
    value?.status === WorkflowStatus.Completed ||
    value?.status === WorkflowStatus.Suspended
      ? true
      : isItemSelected;

  const isCheckboxDisabled =
    loading ||
    value?.status === RepositoryStatus.ADDED ||
    value?.status === RepositoryStatus.WAIT_PR_APPROVAL ||
    value?.status === TaskStatus.Processing ||
    value?.status === TaskStatus.Completed ||
    value?.status === WorkflowStatus.Active ||
    value?.status === WorkflowStatus.Pending ||
    value?.status === WorkflowStatus.Completed ||
    value?.status === WorkflowStatus.Suspended;

  return (
    <tr
      aria-checked={isItemSelected}
      tabIndex={-1}
      style={
        isItemSelected
          ? { backgroundColor: 'var(--bui-bg-neutral-2)' }
          : undefined
      }
    >
      <th scope="row" style={repositoriesTableCellStyle}>
        <Flex align="center" gap="2" style={{ fontSize: '0.875rem' }}>
          <Checkbox
            aria-label={`select ${data.repoName}`}
            isSelected={isChecked}
            isDisabled={isCheckboxDisabled}
            onChange={isSelected => {
              if (isSelected !== isChecked) {
                handleClick({} as MouseEvent, data);
              }
            }}
          />
          <span style={{ lineHeight: '1.5rem' }}>{data.repoName}</span>
        </Flex>
      </th>
      <td style={repositoriesTableCellStyle}>
        {data.repoUrl ? (
          <Link
            to={data.repoUrl}
            style={{
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
              ...bulkImportExternalLinkLinkStyle,
            }}
          >
            {urlHelper(data.repoUrl)}
            <BulkImportExternalLinkIcon />
          </Link>
        ) : (
          <>-</>
        )}
      </td>
      {!isDrawer && (
        <td style={repositoriesTableCellStyle}>
          {data?.organizationUrl ? (
            <Link
              to={data.organizationUrl}
              style={bulkImportExternalLinkLinkStyle}
            >
              {data.orgName}
              <BulkImportExternalLinkIcon />
            </Link>
          ) : (
            <>-</>
          )}
        </td>
      )}

      <td style={repositoriesTableCellStyle}>
        <CatalogInfoStatus
          data={data}
          importStatus={value?.status as string}
          isLoading={loading}
          isItemSelected={isItemSelected}
          isDrawer={isDrawer}
          taskOrWorkflowId={importId}
          prUrl={
            (value as ImportJobStatus)?.github?.pullRequest?.url ||
            (value as ImportJobStatus)?.gitlab?.pullRequest?.url
          }
        />
      </td>
    </tr>
  );
};
