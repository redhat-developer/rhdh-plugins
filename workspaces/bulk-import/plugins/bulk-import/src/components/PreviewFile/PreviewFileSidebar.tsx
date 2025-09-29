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

import { useCallback, useEffect, useState } from 'react';

import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';

import Drawer from '@mui/material/Drawer';
import { makeStyles } from '@mui/styles';
import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ApprovalTool,
  ImportJobStatus,
  PullRequestPreview,
  PullRequestPreviewData,
  RepositoryStatus,
  RepositoryType,
} from '../../types';
import {
  evaluatePRTemplate,
  getPRTemplate,
} from '../../utils/repository-utils';
import { PreviewFileSidebarDrawerContent } from './PreviewFileSidebarDrawerContent';

const useDrawerStyles = makeStyles({
  paper: {
    width: '40%',
    gap: '3%',
  },
});

export const PreviewFileSidebar = ({
  open,
  onClose,
  repositoryType,
  data,
  handleSave,
  isSubmitting,
}: {
  open: boolean;
  data: AddRepositoryData;
  repositoryType: RepositoryType;
  onClose: () => void;
  handleSave: (pullRequest: PullRequestPreviewData, _event: any) => void;
  isSubmitting?: boolean;
}) => {
  const { t } = useTranslation();
  const { setStatus, status, setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();
  const classes = useDrawerStyles();
  const bulkImportApi = useApi(bulkImportApiRef);
  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);
  const [pullRequest, setPullRequest] = useState<PullRequestPreviewData>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchPullRequestData = async (
    id: string,
    repoName: string,
    orgName: string,
    url: string,
    branch: string,
    repoPrTemplate: PullRequestPreview,
    approvalTool?: ApprovalTool,
  ) => {
    if (values?.repositories?.[id]?.catalogInfoYaml?.isInitialized) {
      return values.repositories[id].catalogInfoYaml
        ?.prTemplate as PullRequestPreview;
    }

    const result = await bulkImportApi.getImportAction(
      url || '',
      branch || 'main',
      approvalTool,
    );
    if ((result as Response)?.statusText) {
      setStatus({
        ...status,
        errors: {
          ...(status?.errors || {}),
          [id]: {
            error: {
              title: (result as Response)?.statusText,
              message: [t('previewFile.failedToFetchPR')],
            },
          },
        },
      });
      return repoPrTemplate;
    } else if (
      (result as ImportJobStatus)?.status === RepositoryStatus.WAIT_PR_APPROVAL
    ) {
      const importJobResult = result as ImportJobStatus;
      const evaluatedPRTemplate = evaluatePRTemplate(importJobResult);
      let pullReqPreview = { ...evaluatedPRTemplate.pullReqPreview };

      if (evaluatedPRTemplate.isInvalidEntity) {
        const identityRef = await identityApi.getBackstageIdentity();
        const baseUrl = configApi.getString('app.baseUrl');
        const prTemp = getPRTemplate(
          repoName,
          orgName,
          identityRef.userEntityRef || 'user:default/guest',
          baseUrl as string,
          url,
          branch,
          approvalTool === ApprovalTool.Gitlab ? 'gitlab' : 'github',
        );
        delete prTemp.prDescription;
        delete prTemp.prTitle;

        setStatus({
          ...status,
          infos: {
            ...(status?.infos || {}),
            [id]: {
              error: {
                message: [t('previewFile.invalidEntityYaml')],
              },
            },
          },
        });
        pullReqPreview = {
          ...prTemp,
          pullRequestUrl: pullReqPreview.pullRequestUrl || '',
          prDescription: pullReqPreview.prDescription || '',
          prTitle: pullReqPreview.prTitle || '',
        };
      }
      return pullReqPreview;
    }
    return repoPrTemplate;
  };

  const initializePullRequest = useCallback(async () => {
    const newPullRequestData: PullRequestPreviewData = {};
    if (Object.keys(data?.selectedRepositories || [])?.length > 0) {
      for (const repo of Object.values(data?.selectedRepositories || [])) {
        newPullRequestData[repo.id] = await fetchPullRequestData(
          repo.id,
          repo.repoName || '',
          repo.orgName || '',
          repo.repoUrl || '',
          repo.defaultBranch || 'main',
          repo.catalogInfoYaml?.prTemplate as PullRequestPreview,
          data?.approvalTool,
        );
        setFieldValue(
          `repositories.${repo.id}.catalogInfoYaml.isInitialized`,
          true,
        );
      }
    } else {
      newPullRequestData[data.id] = await fetchPullRequestData(
        data.id,
        data.repoName || '',
        data.orgName || '',
        data.repoUrl || '',
        data.defaultBranch || 'main',
        data.catalogInfoYaml?.prTemplate as PullRequestPreview,
        data?.approvalTool,
      );
      setFieldValue(
        `repositories.${data.id}.catalogInfoYaml.isInitialized`,
        true,
      );
    }
    setPullRequest(newPullRequestData);
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, bulkImportApi, setStatus, status]);

  useEffect(() => {
    if (!isInitialized && data?.id) {
      initializePullRequest();
    }
  }, [isInitialized, data?.id, initializePullRequest]);

  const handleCancel = () => {
    initializePullRequest(); // reset any unsaved changes
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      data-testid={
        !isInitialized
          ? 'preview-pullrequest-sidebar-loading'
          : 'preview-pullrequest-sidebar'
      }
      classes={{
        paper: classes.paper,
      }}
    >
      <PreviewFileSidebarDrawerContent
        repositoryType={repositoryType}
        onCancel={handleCancel}
        isLoading={!isInitialized}
        isSubmitting={isSubmitting}
        data={data}
        pullRequest={pullRequest}
        onSave={handleSave}
        setPullRequest={setPullRequest}
      />
    </Drawer>
  );
};
