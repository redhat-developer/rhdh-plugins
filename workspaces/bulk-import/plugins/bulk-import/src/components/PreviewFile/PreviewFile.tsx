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

import FailIcon from '@mui/icons-material/ErrorOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ErrorType,
  RepositorySelection,
} from '../../types';
import { getCustomisedErrorMessage } from '../../utils/repository-utils';
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
          <Tooltip
            title={
              values.repositoryType === RepositorySelection.Repository
                ? errorMessage.message
                : t('previewFile.prCreationUnsuccessful')
            }
          >
            <Typography component="span">
              <FailIcon
                color="error"
                style={{ verticalAlign: 'sub', paddingTop: '7px' }}
              />
              <Typography component="span" data-testid="failed">
                {' '}
                {t('previewFile.failedToCreatePR')}{' '}
              </Typography>
            </Typography>
          </Tooltip>

          <Link
            to={errorMessage.showRepositoryLink ? data.repoUrl || '' : ''}
            onClick={() =>
              errorMessage.showRepositoryLink ? null : openDrawer(data)
            }
            data-testid="edit-pull-request"
          >
            {errorMessage.showRepositoryLink ? (
              <>
                {t('previewFile.viewRepository')}{' '}
                <OpenInNewIcon
                  style={{ verticalAlign: 'sub', paddingTop: '7px' }}
                />{' '}
              </>
            ) : (
              t('common.edit')
            )}
          </Link>
        </>
      ) : (
        <Typography
          component="span"
          style={{ display: 'flex', alignItems: 'baseline' }}
        >
          <StatusOK />
          {t('status.readyToImport')}
          <Link
            to=""
            style={{ marginLeft: '4px' }}
            onClick={() => openDrawer(data)}
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
        </Typography>
      )}
    </>
  );
};
