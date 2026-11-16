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

import { useApi } from '@backstage/core-plugin-api';
import { ButtonIcon, Tooltip, TooltipTrigger } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportJobStatus,
} from '../../types';
import { BulkImportSyncIcon } from '../bulkImportIcons';

type SyncRepositoryProps = {
  data: AddRepositoryData;
};

const SyncRepository = ({ data }: SyncRepositoryProps) => {
  const { t } = useTranslation();
  const bulkImportApi = useApi(bulkImportApiRef);
  const { setFieldValue } = useFormikContext<AddRepositoriesFormValues>();

  const handleClick = async () => {
    const value = await bulkImportApi.getImportAction(
      data.repoUrl || '',
      data?.defaultBranch || 'main',
      data.approvalTool,
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
    <TooltipTrigger>
      <span data-testid="refresh-repository">
        <ButtonIcon
          icon={<BulkImportSyncIcon size={14} />}
          aria-label={t('repositories.refresh')}
          variant="tertiary"
          onPress={handleClick}
        />
      </span>
      <Tooltip placement="top">{t('repositories.refresh')}</Tooltip>
    </TooltipTrigger>
  );
};

export default SyncRepository;
