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

import React from 'react';
import { useAsync } from 'react-use';

import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';

import { useQuery } from '@tanstack/react-query';
import { useFormikContext } from 'formik';

import { bulkImportApiRef } from '../api/BulkImportBackendClient';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportJobs,
} from '../types';
import { prepareDataForAddedRepositories } from '../utils/repository-utils';

export const useAddedRepositories = (
  pageNumber: number,
  rowsPerPage: number,
  searchString: string,
  pollInterval?: number,
): {
  data: {
    addedRepositories: AddRepositoryData[];
    totalJobs: number;
  };
  error: any;
  loading: boolean;
  refetch: () => void;
} => {
  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);
  const { value: user } = useAsync(async () => {
    const identityRef = await identityApi.getBackstageIdentity();
    return identityRef.userEntityRef;
  });

  const baseUrl = configApi.getString('app.baseUrl');

  const bulkImportApi = useApi(bulkImportApiRef);
  const { setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();
  const fetchAddedRepositories = async (
    page: number,
    size: number,
    searchStr: string,
  ) => await bulkImportApi.getImportJobs(page, size, searchStr);

  const {
    data: value,
    error,
    isLoading: isLoadingTable,
    refetch,
  } = useQuery(
    ['importJobs', pageNumber, rowsPerPage, searchString],
    () => fetchAddedRepositories(pageNumber, rowsPerPage, searchString),
    { refetchInterval: pollInterval || 60000 },
  );

  const prepareData = React.useMemo(() => {
    const repoData = prepareDataForAddedRepositories(
      value as ImportJobs | Response,
      user as string,
      baseUrl as string,
    );
    if (
      Object.values(repoData.repoData).length !==
      Object.values(values.repositories).length
    )
      setFieldValue(`repositories`, repoData.repoData);
    return {
      addedRepositories: Object.values(repoData.repoData),
      totalJobs: repoData.totalJobs,
    };
  }, [value, user, baseUrl, values.repositories, setFieldValue]);

  return {
    data: prepareData,
    loading: isLoadingTable,
    error: {
      ...(error ?? {}),
      ...((value as Response)?.statusText
        ? {
            name: 'Error',
            message: (value as Response)?.statusText,
          }
        : {}),
    },
    refetch,
  };
};
