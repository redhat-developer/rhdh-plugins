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

import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';

import { useFormikContext } from 'formik';
import yaml from 'js-yaml';
import { get } from 'lodash';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ApprovalTool,
  PullRequestPreviewData,
  RepositorySelection,
} from '../../types';
import {
  ImportJobResponse,
  ImportJobStatus,
  isGithubJob,
} from '../../types/response-types';
import {
  getJobErrors,
  prepareDataForSubmission,
} from '../../utils/repository-utils';
import { PreviewFileSidebar } from '../PreviewFile/PreviewFileSidebar';

const EditCatalogInfo = ({
  importStatus,
  onClose,
  open,
}: {
  importStatus: ImportJobStatus;
  onClose: () => void;
  open: boolean;
}) => {
  const { t } = useTranslation();
  const bulkImportApi = useApi(bulkImportApiRef);
  const { setSubmitting, setStatus, isSubmitting } =
    useFormikContext<AddRepositoriesFormValues>();
  let yamlContent = {} as Entity;
  try {
    if (importStatus) {
      const gitProvider = isGithubJob(importStatus) ? 'github' : 'gitlab';
      yamlContent = yaml.loadAll(
        importStatus[gitProvider]?.pullRequest?.catalogInfoContent ?? '',
      )[0] as Entity;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(e);
    yamlContent = {} as Entity;
  }
  const catalogEntityName = yamlContent?.metadata?.name;
  const entityOwner = yamlContent?.spec?.owner as string;

  const previewData: AddRepositoryData = {
    id: importStatus?.repository?.id,
    repoUrl: importStatus?.repository?.url,
    approvalTool: importStatus?.approvalTool,
    repoName: importStatus?.repository?.name,
    orgName: importStatus?.repository?.organization,
    catalogInfoYaml: {
      prTemplate: {
        prTitle: importStatus?.github?.pullRequest?.title,
        prDescription: importStatus?.github?.pullRequest?.body,
        useCodeOwnersFile: !entityOwner,
        componentName: catalogEntityName,
        entityOwner,
        yaml: yamlContent,
      },
    },
  };

  const handleSave = async (
    pullRequest: PullRequestPreviewData,
    _event: any,
  ) => {
    const importRepositories = prepareDataForSubmission(
      {
        [`${importStatus.repository.id}`]: {
          id: importStatus.repository.id,
          catalogInfoYaml: {
            prTemplate: pullRequest[`${importStatus.repository.id}`],
          },
          approvalTool: importStatus.approvalTool,
          defaultBranch: importStatus.repository?.defaultBranch,
          organizationUrl: importStatus.repository.url
            ?.substring(
              0,
              importStatus.repository.url?.indexOf(
                importStatus.repository.organization || '',
              ),
            )
            .concat(importStatus.repository.organization || ''),
          orgName: importStatus.repository?.organization,
          repoName: importStatus.repository.name,
          repoUrl: importStatus.repository.url,
        },
      },
      importStatus?.approvalTool as ApprovalTool,
    );
    try {
      setSubmitting(true);
      const dryrunResponse: ImportJobResponse[] =
        await bulkImportApi.createImportJobs(importRepositories, true);
      const dryRunErrors = getJobErrors(dryrunResponse);
      if (Object.keys(dryRunErrors?.errors || {}).length > 0) {
        setStatus(dryRunErrors);
        setSubmitting(false);
      } else {
        const createJobResponse: ImportJobResponse[] | Response =
          await bulkImportApi.createImportJobs(importRepositories);
        setSubmitting(true);
        if (!Array.isArray(createJobResponse)) {
          setStatus({
            [`${importStatus.repository.id}`]: {
              repository: importStatus.repository.name,
              catalogEntityName,
              error: {
                message:
                  get(createJobResponse, 'error.message') ||
                  t('repositories.failedToCreatePullRequest'),
                status:
                  get(createJobResponse, 'error.name') ||
                  t('repositories.errorOccured'),
              },
            },
          });
        } else {
          const createJobErrors = getJobErrors(createJobResponse);
          if (Object.keys(createJobErrors?.errors || {}).length > 0) {
            setStatus(createJobErrors);
          } else {
            onClose();
          }
        }
        setSubmitting(false);
      }
    } catch (error: any) {
      setStatus({
        [`${importStatus.repository.id}`]: {
          repository: importStatus.repository.name,
          catalogEntityName,
          error: {
            message: error?.message || t('repositories.errorOccured'),
            status: error?.name,
          },
        },
      });
      setSubmitting(false);
    }
  };

  return (
    <PreviewFileSidebar
      open={open}
      data={previewData}
      isSubmitting={isSubmitting}
      repositoryType={RepositorySelection.Repository}
      onClose={onClose}
      handleSave={handleSave}
    />
  );
};

export default EditCatalogInfo;
