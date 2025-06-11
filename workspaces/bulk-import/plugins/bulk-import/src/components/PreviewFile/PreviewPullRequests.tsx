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

import type { ChangeEvent, ReactNode } from 'react';
import { useState } from 'react';

import ErrorOutline from '@mui/icons-material/ErrorOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  PullRequestPreviewData,
} from '../../types';
import { PreviewPullRequest } from './PreviewPullRequest';

const CustomTabPanel = ({
  children,
  value,
  index,
  ...other
}: {
  children?: ReactNode;
  index: number;
  value: number;
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preview-pullrequest-panel-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  );
};

const getLabel = (status: any, repoId: string, repoName: string) => {
  if (status?.errors?.[`${repoId}`]) {
    return (
      <Typography component="span" data-testid="pr-creation-failed">
        <ErrorOutline
          color="error"
          style={{ verticalAlign: 'sub', paddingTop: '7px' }}
        />{' '}
        {repoName}
      </Typography>
    );
  }
  if (status?.infos?.[`${repoId}`]) {
    return (
      <Typography component="span" data-testid="info-message">
        <InfoOutlined
          color="info"
          style={{ verticalAlign: 'sub', paddingTop: '7px' }}
        />{' '}
        {repoName}
      </Typography>
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
  const [value, setValue] = useState(0);
  const { status } = useFormikContext<AddRepositoriesFormValues>();

  const handleChange = (_event: ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

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
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          indicatorColor="primary"
          scrollButtons="auto"
          aria-label="preview-pull-requests"
        >
          {repositories.map((repo: AddRepositoryData) => {
            return (
              <Tab
                label={getLabel(status, repo.id, repo?.repoName || '')}
                id={repo.repoName}
                key={repo.id}
              />
            );
          })}
        </Tabs>
      </Box>
      {Object.values(repositories).map((repo: AddRepositoryData, index) => {
        return (
          <CustomTabPanel value={value} index={index} key={repo.id}>
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
          </CustomTabPanel>
        );
      })}
    </Box>
  );
};
