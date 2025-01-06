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

import React from 'react';

import { useApi } from '@backstage/core-plugin-api';

import SyncIcon from '@mui/icons-material/Sync';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportJobStatus,
} from '../../types';

type SyncRepositoryProps = {
  data: AddRepositoryData;
};

const SyncRepository = ({ data }: SyncRepositoryProps) => {
  const bulkImportApi = useApi(bulkImportApiRef);
  const { setFieldValue } = useFormikContext<AddRepositoriesFormValues>();

  const handleClick = async () => {
    const value = await bulkImportApi.getImportAction(
      data.repoUrl || '',
      data?.defaultBranch || 'main',
    );
    setFieldValue(
      `repositories.[${data.id}].catalogInfoYaml.status`,
      (value as ImportJobStatus).status,
    );
    setFieldValue(
      `repositories.[${data.id}].catalogInfoYaml.lastUpdated`,
      (value as ImportJobStatus).lastUpdate,
    );
  };

  return (
    <Tooltip title="Refresh">
      <span data-testid="refresh-repository">
        <IconButton
          color="inherit"
          onClick={() => handleClick()}
          aria-label="Refresh"
          size="large"
        >
          <SyncIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default SyncRepository;
