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

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsync } from 'react-use';

import { useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { ButtonIcon, Tooltip, TooltipTrigger } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportJobStatus,
  RepositoryStatus,
} from '../../types';
import {
  BulkImportEditIcon,
  BulkImportExternalLinkIcon,
} from '../bulkImportIcons';
import { useDrawer } from '../DrawerContext';

const CatalogInfoAction = ({ data }: { data: AddRepositoryData }) => {
  const { t } = useTranslation();
  const { setDrawerData, setOpenDrawer, drawerData } = useDrawer();
  const { setStatus } = useFormikContext<AddRepositoriesFormValues>();
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bulkImportApi = useApi(bulkImportApiRef);

  const repoUrl = searchParams.get('repository');
  const defaultBranch = searchParams.get('defaultBranch');

  const { allowed } = usePermission({
    permission: bulkImportPermission,
  });
  const { value, loading } = useAsync(async () => {
    if (repoUrl) {
      return await bulkImportApi.getImportAction(
        repoUrl,
        defaultBranch || 'main',
        data.approvalTool,
      );
    }
    return null;
  }, [repoUrl, defaultBranch]);

  const handleOpenDrawer = (importStatus: ImportJobStatus) => {
    searchParams.set('repository', data.repoUrl || '');
    searchParams.set('defaultBranch', data.defaultBranch || 'main');
    navigate({
      pathname: location.pathname,
      search: `?${searchParams.toString()}`,
    });
    setOpenDrawer(true);
    setDrawerData(importStatus);
  };

  const hasPermissionToEdit =
    allowed &&
    values.repositories[data.id]?.catalogInfoYaml?.status ===
      RepositoryStatus.WAIT_PR_APPROVAL;

  const canView =
    values?.repositories?.[data.id]?.catalogInfoYaml?.status ===
      RepositoryStatus.ADDED && values?.repositories?.[data.id]?.repoUrl;

  const removeQueryParams = () => {
    searchParams.delete('repository');
    searchParams.delete('defaultBranch');
    navigate({
      pathname: location.pathname,
      search: `?${searchParams.toString()}`,
    });
  };

  useEffect(() => {
    if (!loading && repoUrl && defaultBranch && value) {
      const shouldOpenPanel =
        value?.status === RepositoryStatus.WAIT_PR_APPROVAL &&
        values.repositories[(value as ImportJobStatus)?.repository?.id];

      if (value instanceof Response) {
        setOpenDrawer(false);
        setStatus({
          title: value.statusText,
          url: value.url,
        });
        removeQueryParams();
      } else if (shouldOpenPanel) {
        setOpenDrawer(true);
        if (Object.keys(drawerData || {}).length === 0) {
          setDrawerData(value as ImportJobStatus);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl, defaultBranch, value?.status, values?.repositories, loading]);

  const catalogAction = () => {
    if (hasPermissionToEdit) {
      return {
        tooltip: t('repositories.editCatalogInfoTooltip'),
        control: (
          <ButtonIcon
            icon={<BulkImportEditIcon size={14} />}
            aria-label={t('common.update')}
            data-testid="update"
            variant="tertiary"
            onPress={() => handleOpenDrawer(value as ImportJobStatus)}
          />
        ),
        dataTestId: 'edit-catalog-info',
      };
    }
    if (canView) {
      return {
        tooltip: t('repositories.viewCatalogInfoTooltip'),
        control: (
          <a
            href={canView}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('common.view')}
          >
            <ButtonIcon
              icon={<BulkImportExternalLinkIcon size={14} />}
              aria-label={t('common.view')}
              variant="tertiary"
            />
          </a>
        ),
        dataTestId: 'view-catalog-info',
      };
    }
    return null;
  };

  const action = catalogAction();

  return action?.tooltip ? (
    <TooltipTrigger>
      <span data-testid={action.dataTestId}>{action.control}</span>
      <Tooltip placement="top">{action.tooltip}</Tooltip>
    </TooltipTrigger>
  ) : null;
};

export default CatalogInfoAction;
