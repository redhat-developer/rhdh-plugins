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

import { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useFormikContext } from 'formik';

import { useNumberOfApprovalTools } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  ApprovalTool as ApprovalToolEnum,
  RepositorySelection,
} from '../../types';
import { AddRepositoriesTableToolbar } from './AddRepositoriesTableToolbar';
import ApprovalTool from './ApprovalTool';
import { RepositoriesTable } from './RepositoriesTable';

export const AddRepositoriesTable = ({ title }: { title?: string }) => {
  const { t } = useTranslation();
  const { values, setFieldValue } =
    useFormikContext<AddRepositoriesFormValues>();
  const [isApprovalToolGitlab, setIsApprovalToolGitlab] = useState(false);

  useEffect(() => {
    setIsApprovalToolGitlab(values.approvalTool === ApprovalToolEnum.Gitlab);
  }, [values.approvalTool]);
  const [searchString, setSearchString] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  useDebounce(
    () => {
      setSearchString(searchInput);
      setPage(0);
    },
    300,
    [searchInput],
  );

  const { numberOfApprovalTools, githubConfigured } =
    useNumberOfApprovalTools();

  return (
    <Box sx={{ width: '100%' }}>
      <Paper style={{ width: '100%' }}>
        {numberOfApprovalTools > 1 && githubConfigured && (
          <ApprovalTool
            approvalTool={values.approvalTool}
            setFieldValue={setFieldValue}
          />
        )}
        <AddRepositoriesTableToolbar
          title={
            title ||
            `${t('addRepositories.selectedLabel')} ${isApprovalToolGitlab ? t('addRepositories.selectedProjects') : t('addRepositories.selectedRepositories')}`
          }
          setSearchString={setSearchInput}
          onPageChange={setPage}
          isApprovalToolGitlab={isApprovalToolGitlab}
        />
        {values.repositoryType === RepositorySelection.Repository ? (
          <RepositoriesTable
            searchString={searchString}
            page={page}
            isApprovalToolGitlab={isApprovalToolGitlab}
            setPage={setPage}
          />
        ) : (
          <RepositoriesTable
            searchString={searchString}
            page={page}
            isApprovalToolGitlab={isApprovalToolGitlab}
            setPage={setPage}
            showOrganizations
          />
        )}
      </Paper>
    </Box>
  );
};
