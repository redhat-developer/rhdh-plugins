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

import { useState } from 'react';

import { Tab, TabList, TabPanel, Tabs, Text } from '@backstage/ui';

import { useFormikContext } from 'formik';

import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  PullRequestPreviewData,
} from '../../types';
import { BulkImportErrorIcon, BulkImportInfoIcon } from '../bulkImportIcons';
import { PreviewPullRequest } from './PreviewPullRequest';

const getLabel = (status: any, repoId: string, repoName: string) => {
  if (status?.errors?.[`${repoId}`]) {
    return (
      <span
        data-testid="pr-creation-failed"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <BulkImportErrorIcon />
        <Text>{repoName}</Text>
      </span>
    );
  }
  if (status?.infos?.[`${repoId}`]) {
    return (
      <span
        data-testid="info-message"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <BulkImportInfoIcon />
        <Text>{repoName}</Text>
      </span>
    );
  }
  return repoName;
};

export const PreviewPullRequests = ({
  repositories,
  pullRequest,
  setPullRequest,
  formErrors,
  setFormErrors,
}: {
  repositories: AddRepositoryData[];
  pullRequest: PullRequestPreviewData;
  setPullRequest: (pullRequest: PullRequestPreviewData) => void;
  formErrors: PullRequestPreviewData;
  setFormErrors: (pullRequest: PullRequestPreviewData) => void;
}) => {
  const { status } = useFormikContext<AddRepositoriesFormValues>();
  const [selectedKey, setSelectedKey] = useState(repositories[0]?.id ?? '');

  if (Object.values(repositories || []).length === 1) {
    return (
      <PreviewPullRequest
        repoId={Object.values(repositories)[0].id || ''}
        repoUrl={Object.values(repositories)[0].repoUrl || ''}
        repoBranch={Object.values(repositories)[0].defaultBranch || 'main'}
        pullRequest={pullRequest}
        setPullRequest={setPullRequest}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
      />
    );
  }

  return (
    <Tabs
      selectedKey={selectedKey}
      onSelectionChange={key => setSelectedKey(String(key))}
      style={{ width: '100%' }}
    >
      <TabList aria-label="preview-pull-requests">
        {repositories.map((repo: AddRepositoryData) => (
          <Tab key={repo.id} id={repo.id}>
            {getLabel(status, repo.id, repo?.repoName || '')}
          </Tab>
        ))}
      </TabList>
      {repositories.map((repo: AddRepositoryData) => (
        <TabPanel key={repo.id} id={repo.id}>
          <PreviewPullRequest
            repoId={repo.id}
            repoUrl={repo.repoUrl || ''}
            repoBranch={repo.defaultBranch || 'main'}
            pullRequest={pullRequest}
            setPullRequest={setPullRequest}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            others={{ addPaddingTop: true }}
          />
        </TabPanel>
      ))}
    </Tabs>
  );
};
