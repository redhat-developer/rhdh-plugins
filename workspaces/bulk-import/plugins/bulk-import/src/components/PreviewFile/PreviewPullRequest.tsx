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

import { Link, MarkdownContent } from '@backstage/core-components';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  PullRequestPreviewData,
  RepositoryStatus,
} from '../../types';
import { getCustomisedErrorMessage } from '../../utils/repository-utils';
import { PreviewPullRequestForm } from './PreviewPullRequestForm';

export const PreviewPullRequest = ({
  repoId,
  repoUrl,
  pullRequest,
  setPullRequest,
  formErrors,
  setFormErrors,
  others,
}: {
  repoId: string;
  repoUrl: string;
  repoBranch: string;
  pullRequest: PullRequestPreviewData;
  formErrors: PullRequestPreviewData;
  others?: {
    addPaddingTop?: boolean;
  };
  setPullRequest: (pullRequest: PullRequestPreviewData) => void;
  setFormErrors: (pullRequest: PullRequestPreviewData) => void;
}) => {
  const { t } = useTranslation();
  const { status } = useFormikContext<AddRepositoriesFormValues>();

  const error = status?.errors?.[repoId];
  const info = status?.infos?.[repoId];
  if (
    info?.error?.message.includes(
      RepositoryStatus.CATALOG_INFO_FILE_EXISTS_IN_REPO,
    ) &&
    !error
  ) {
    // hide preview pull request form for this status
    return (
      <Box marginTop={others?.addPaddingTop ? 2 : 0}>
        <Alert severity="info">
          {
            getCustomisedErrorMessage(info.error.message, (key: string) =>
              t(key as any, {}),
            ).message
          }
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Box marginTop={others?.addPaddingTop ? 2 : 0}>
          <Alert severity="error">
            <AlertTitle>
              {error.error?.title
                ? error.error?.title
                : t('previewFile.failedToCreatePR')}
            </AlertTitle>
            {
              getCustomisedErrorMessage(error.error.message, (key: string) =>
                t(key as any, {}),
              ).message
            }{' '}
            {error?.repository?.organization && error?.repository?.name && (
              <Link
                to={`https://github.com/${error.repository.organization}/${error.repository.name}`}
              >
                {t('previewFile.viewRepository')}
                <OpenInNewIcon
                  style={{ verticalAlign: 'sub', paddingTop: '7px' }}
                />
              </Link>
            )}
          </Alert>
          {!others?.addPaddingTop && <br />}
        </Box>
      )}
      {info && (
        <Box marginTop={others?.addPaddingTop ? 2 : 0}>
          <Alert severity="info" data-testid="other-info">
            {
              getCustomisedErrorMessage(info.error.message, (key: string) =>
                t(key as any, {}),
              ).message
            }{' '}
          </Alert>
          {!others?.addPaddingTop && <br />}
        </Box>
      )}
      {pullRequest[repoId]?.pullRequestUrl && (
        <Box marginTop={others?.addPaddingTop ? 2 : 0}>
          <Alert severity="info" data-testid="pull-request-info">
            <Box
              sx={{
                margin: 0,
                padding: 0,
                '& p': {
                  margin: 0,
                  padding: 0,
                },
              }}
            >
              <MarkdownContent
                content={t('previewFile.pullRequestPendingApproval')
                  .replace(
                    '{{pullRequestUrl}}',
                    pullRequest[repoId].pullRequestUrl || '',
                  )
                  .replace(
                    '{{pullRequestText}}',
                    t('previewFile.pullRequestText'),
                  )}
              />
            </Box>
          </Alert>
        </Box>
      )}
      <PreviewPullRequestForm
        repoId={repoId}
        repoUrl={repoUrl}
        pullRequest={pullRequest}
        setPullRequest={setPullRequest}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
      />
    </>
  );
};
