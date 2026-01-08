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

import { useApi } from '@backstage/core-plugin-api';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, FormikHelpers } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useNumberOfApprovalTools } from '../../hooks';
import {
  AddRepositoriesFormValues,
  ApprovalTool,
  CreateImportJobRepository,
  ImportJobResponse,
  RepositorySelection,
} from '../../types';
import {
  getJobErrors,
  prepareDataForSubmission,
} from '../../utils/repository-utils';
import { DrawerContextProvider } from '../DrawerContext';
import { AddRepositories } from './AddRepositories';

export const AddRepositoriesForm = ({
  onErrorChange,
}: {
  onErrorChange?: (error: any) => void;
}) => {
  const bulkImportApi = useApi(bulkImportApiRef);
  const queryClient = useQueryClient();
  const { numberOfApprovalTools, gitlabConfigured } =
    useNumberOfApprovalTools();

  // Set default approval tool based on configuration
  const getDefaultApprovalTool = () => {
    if (numberOfApprovalTools === 1) {
      return gitlabConfigured ? ApprovalTool.Gitlab : ApprovalTool.Git;
    }
    return ApprovalTool.Git; // Default to GitHub when both are configured
  };

  const initialValues: AddRepositoriesFormValues = {
    repositoryType: RepositorySelection.Repository,
    repositories: {},
    excludedRepositories: {},
    approvalTool: getDefaultApprovalTool(),
  };

  const createImportJobs = (importOptions: {
    importJobs: CreateImportJobRepository[];
    dryRun?: boolean;
  }) =>
    bulkImportApi.createImportJobs(
      importOptions.importJobs,
      importOptions.dryRun,
    );

  const mutationCreate = useMutation(createImportJobs);

  // Notify parent component when error changes
  useEffect(() => {
    onErrorChange?.(mutationCreate.error);
  }, [mutationCreate.error, onErrorChange]);

  const handleSubmit = async (
    values: AddRepositoriesFormValues,
    formikHelpers: FormikHelpers<AddRepositoriesFormValues>,
  ) => {
    formikHelpers.setStatus(null);
    const importRepositories = prepareDataForSubmission(
      values.repositories,
      values.approvalTool,
    );
    mutationCreate.mutate({
      importJobs: importRepositories,
      dryRun: true,
    });
    if (!mutationCreate.isError) {
      const dryRunErrors = getJobErrors(
        mutationCreate.data as ImportJobResponse[],
      );
      if (Object.keys(dryRunErrors?.errors || {}).length > 0) {
        formikHelpers.setStatus(dryRunErrors);
      } else {
        formikHelpers.setStatus(dryRunErrors); // to show info messages
        const submitResult = await mutationCreate.mutateAsync({
          importJobs: importRepositories,
        });
        const createJobErrors = getJobErrors(
          submitResult as ImportJobResponse[],
        );
        if (Object.keys(createJobErrors?.errors || {}).length > 0) {
          formikHelpers.setStatus(createJobErrors);
        } else {
          // Successfully imported - stay on the same page
          // Clear the selected repositories to reset the form
          formikHelpers.setFieldValue('repositories', {});

          // Invalidate repository list queries to refresh data
          queryClient.invalidateQueries(['repositories']);
          queryClient.invalidateQueries(['organizations']);

          // Invalidate specific importAction queries for each imported repository
          importRepositories.forEach(repo => {
            queryClient.invalidateQueries([
              'importAction',
              repo.repository.url,
              repo.repository.defaultBranch,
              repo.approvalTool,
            ]);
          });
        }
      }
    }
  };

  return (
    <DrawerContextProvider>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        <AddRepositories error={mutationCreate.error} />
      </Formik>
    </DrawerContextProvider>
  );
};
