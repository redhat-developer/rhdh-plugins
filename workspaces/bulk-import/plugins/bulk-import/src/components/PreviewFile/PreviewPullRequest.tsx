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
import { Alert, Box, Flex } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  PullRequestPreviewData,
  RepositoryStatus,
} from '../../types';
import { getCustomisedErrorMessage } from '../../utils/repository-utils';
import {
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { PreviewPullRequestForm } from './PreviewPullRequestForm';

const sectionSpacing = (addPaddingTop?: boolean) => ({
  marginTop: addPaddingTop ? '16px' : 0,
});

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
      <Box style={sectionSpacing(others?.addPaddingTop)}>
        <Alert
          status="info"
          description={
            getCustomisedErrorMessage(info.error.message, (key: string) =>
              t(key as any, {}),
            ).message
          }
        />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Box style={sectionSpacing(others?.addPaddingTop)}>
          <Alert
            status="danger"
            title={
              error.error?.title
                ? error.error?.title
                : t('previewFile.failedToCreatePR')
            }
            description={
              getCustomisedErrorMessage(error.error.message, (key: string) =>
                t(key as any, {}),
              ).message
            }
          />
          {error?.repository?.organization && error?.repository?.name && (
            <Link
              to={`https://github.com/${error.repository.organization}/${error.repository.name}`}
              style={bulkImportExternalLinkLinkStyle}
            >
              {t('previewFile.viewRepository')}
              <BulkImportExternalLinkIcon />
            </Link>
          )}
          {!others?.addPaddingTop && <br />}
        </Box>
      )}
      {info && (
        <Box style={sectionSpacing(others?.addPaddingTop)}>
          <Alert
            status="info"
            data-testid="other-info"
            description={
              getCustomisedErrorMessage(info.error.message, (key: string) =>
                t(key as any, {}),
              ).message
            }
          />
          {!others?.addPaddingTop && <br />}
        </Box>
      )}
      {pullRequest[repoId]?.pullRequestUrl && (
        <Box style={sectionSpacing(others?.addPaddingTop)}>
          <Alert status="info" data-testid="pull-request-info">
            <Flex
              direction="column"
              style={{
                margin: 0,
                padding: 0,
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
            </Flex>
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
