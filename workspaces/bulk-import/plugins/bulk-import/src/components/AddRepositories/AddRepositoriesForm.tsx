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

import { useNavigate } from 'react-router-dom';

import { useApi } from '@backstage/core-plugin-api';

import { useMutation } from '@tanstack/react-query';
import { Formik, FormikHelpers } from 'formik';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import {
  AddRepositoriesFormValues,
  ApprovalTool,
  RepositorySelection,
} from '../../types';
import { DrawerContextProvider } from '../DrawerContext';
import { AddRepositories } from './AddRepositories';

export const AddRepositoriesForm = () => {
  const bulkImportApi = useApi(bulkImportApiRef);
  const navigate = useNavigate();
  const initialValues: AddRepositoriesFormValues = {
    repositoryType: RepositorySelection.Repository,
    repositories: {},
    excludedRepositories: {},
    approvalTool: ApprovalTool.Git,
    templateOptions: '',
  };

  const executeTemplate = (importOptions: {
    repositories: string[];
    templateParameters: Record<string, any>;
  }) =>
    bulkImportApi.executeTemplate(
      importOptions.repositories,
      importOptions.templateParameters,
    );

  const mutationCreate = useMutation(executeTemplate);

  const handleSubmit = async (
    values: AddRepositoriesFormValues,
    formikHelpers: FormikHelpers<AddRepositoriesFormValues>,
  ) => {
    formikHelpers.setStatus(null);
    const repositories = Object.values(values.repositories)
      .map(repo => repo.repoUrl)
      .filter((repoUrl): repoUrl is string => !!repoUrl);
    mutationCreate.mutate(
      {
        repositories,
        templateParameters: JSON.parse(values.templateOptions as any),
      },
      {
        onSuccess: () => {
          navigate(`..`);
        },
      },
    );
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
