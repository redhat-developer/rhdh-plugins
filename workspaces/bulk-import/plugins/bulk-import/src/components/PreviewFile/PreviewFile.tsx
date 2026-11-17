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

import { Link, StatusOK } from '@backstage/core-components';
import { Flex, Text, Tooltip, TooltipTrigger } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ErrorType,
  RepositorySelection,
} from '../../types';
import { getCustomisedErrorMessage } from '../../utils/repository-utils';
import {
  BulkImportErrorIcon,
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { useDrawer } from '../DrawerContext';

export const PreviewFile = ({ data }: { data: AddRepositoryData }) => {
  const { t } = useTranslation();
  const { status, values } = useFormikContext<AddRepositoriesFormValues>();
  const { setOpenDrawer, setDrawerData } = useDrawer();
  const statusErrors = (status?.errors as ErrorType) || {};

  const errorMessage = getCustomisedErrorMessage(
    Object.values(statusErrors).find(s => s?.repository?.name === data.repoName)
      ?.error.message,
    (key: string) => t(key as any, {}),
  );

  const openDrawer = (dd: AddRepositoryData) => {
    setDrawerData(dd);
    setOpenDrawer(true);
  };

  return (
    <>
      {Object.keys(statusErrors).length > 0 &&
      Object.values(statusErrors).find(
        s =>
          s?.repository?.name === data.repoName ||
          (values.repositoryType === RepositorySelection.Organization &&
            s?.repository?.organization === data.orgName),
      ) ? (
        <>
          <TooltipTrigger>
            <span>
              <BulkImportErrorIcon />
              <Text data-testid="failed">
                {' '}
                {t('previewFile.failedToCreatePR')}{' '}
              </Text>
            </span>
            <Tooltip placement="top">
              {values.repositoryType === RepositorySelection.Repository
                ? errorMessage.message
                : t('previewFile.prCreationUnsuccessful')}
            </Tooltip>
          </TooltipTrigger>

          <Link
            to={errorMessage.showRepositoryLink ? data.repoUrl || '' : ''}
            onClick={e => {
              if (!errorMessage.showRepositoryLink) {
                e.preventDefault();
                openDrawer(data);
              }
            }}
            data-testid="edit-pull-request"
            style={
              errorMessage.showRepositoryLink
                ? bulkImportExternalLinkLinkStyle
                : undefined
            }
          >
            {errorMessage.showRepositoryLink ? (
              <>
                {t('previewFile.viewRepository')}
                <BulkImportExternalLinkIcon />
              </>
            ) : (
              t('common.edit')
            )}
          </Link>
        </>
      ) : (
        <Flex
          align="center"
          gap="1"
          style={{ display: 'inline-flex', alignItems: 'baseline' }}
        >
          <StatusOK />
          <Text>{t('status.readyToImport')}</Text>
          <Link
            to=""
            style={{ marginLeft: '4px' }}
            onClick={e => {
              e.preventDefault();
              openDrawer(data);
            }}
            data-testid={
              Object.keys(data?.selectedRepositories || []).length > 1
                ? 'preview-files'
                : 'preview-file'
            }
          >
            {Object.keys(data?.selectedRepositories || []).length > 1
              ? t('previewFile.previewFiles')
              : t('previewFile.previewFile')}
          </Link>
        </Flex>
      )}
    </>
  );
};
