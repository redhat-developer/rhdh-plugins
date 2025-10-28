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

import { useApi } from '@backstage/core-plugin-api';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, FormikHelpers } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useNumberOfApprovalTools } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  ApprovalTool,
  CreateImportJobRepository,
  ImportJobResponse,
  RepositorySelection,
} from '../../types';
import { getImageForIconClass } from '../../utils/icons';
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
  const { t } = useTranslation();
  const bulkImportApi = useApi(bulkImportApiRef);
  const queryClient = useQueryClient();
  const { numberOfApprovalTools, gitlabConfigured } =
    useNumberOfApprovalTools();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

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
          // Invalidate repository queries to refresh data and show updated status
          queryClient.invalidateQueries(['repositories']);
          // Trigger refetch of individual repository statuses
          setRefetchTrigger(prev => prev + 1);
        }
      }
    }
  };

  // Check if there's an error to display
  const hasError = mutationCreate.error;
  const errorMessage =
    (mutationCreate.error as any)?.error?.message &&
    JSON.parse((mutationCreate.error as any).error.message);

  if (hasError) {
    return (
      <Box sx={{ display: 'flex', minHeight: '50vh', padding: 3 }}>
        <Box sx={{ flex: 1, pr: 2 }}>
          <Alert severity="error">
            <AlertTitle>
              {errorMessage?.error?.name ??
                (mutationCreate.error as any)?.error?.name ??
                t('errors.errorOccurred')}
            </AlertTitle>
            {errorMessage?.error?.message ??
              (mutationCreate.error as any)?.err ??
              t('errors.failedToCreatePullRequest')}
          </Alert>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={getImageForIconClass('missing-configuration')}
            alt="Missing configuration"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              opacity: 0.8,
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <DrawerContextProvider>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        <AddRepositories refetchTrigger={refetchTrigger} />
      </Formik>
    </DrawerContextProvider>
  );
};
