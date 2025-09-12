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

import { useMemo } from 'react';
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
  AddedRepositoryColumnNameEnum,
  AddRepositoriesFormValues,
  AddRepositoryData,
  Repository,
  SortingOrderEnum,
} from '../types';
import { prepareDataForAddedRepositories } from '../utils/repository-utils';

export const useAddedRepositories = (
  pageNumber: number,
  rowsPerPage: number,
  searchString: string,
  sortColumn: AddedRepositoryColumnNameEnum,
  sortOrder: SortingOrderEnum,
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
  useFormikContext<AddRepositoriesFormValues>();
  const fetchAddedRepositories = async () =>
    await bulkImportApi.findAllStoredRepositories();

  const {
    data: value,
    error,
    isLoading: isLoadingTable,
    refetch,
  } = useQuery(
    [
      'importJobs',
      pageNumber,
      rowsPerPage,
      searchString,
      sortColumn,
      sortOrder,
    ],
    () => fetchAddedRepositories(),
    { refetchInterval: pollInterval || 60000, refetchOnWindowFocus: false },
  );

  const prepareData = useMemo(() => {
    const repoData = prepareDataForAddedRepositories(
      value as { repositories: Repository[]; totalCount: number } | undefined,
      user as string,
      baseUrl as string,
    );
    return {
      addedRepositories: Object.values(repoData.repoData),
      totalJobs: repoData.totalJobs,
    };
  }, [value, user, baseUrl]);

  return {
    data: prepareData,
    loading: isLoadingTable,
    error: {
      ...(error ?? {}),
      ...((value as any)?.statusText
        ? {
            name: 'Error',
            message: (value as any)?.statusText,
          }
        : {}),
    },
    refetch,
  };
};
