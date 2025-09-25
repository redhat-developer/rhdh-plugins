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
import {
  ConfigApi,
  createApiRef,
  IdentityApi,
} from '@backstage/core-plugin-api';

import {
  AddedRepositoryColumnNameEnum,
  APITypes,
  CreateImportJobRepository,
  ImportJobResponse,
  ImportJobs,
  ImportJobStatus,
  OrgAndRepoResponse,
  SortingOrderEnum,
} from '../types';

// @public
export type BulkImportAPI = {
  dataFetcher: (
    page: number,
    size: number,
    searchString: string,
    options?: APITypes,
  ) => Promise<OrgAndRepoResponse>;
  getImportJobs: (
    page: number,
    size: number,
    searchString: string,
    sortColumn: AddedRepositoryColumnNameEnum,
    sortOrder: SortingOrderEnum,
  ) => Promise<ImportJobs | Response>;
  createImportJobs: (
    importRepositories: CreateImportJobRepository[],
    dryRun?: boolean,
  ) => Promise<ImportJobResponse[]>;
  deleteImportAction: (
    repo: string,
    defaultBranch: string,
  ) => Promise<ImportJobStatus | Response>;
  getImportAction: (
    repo: string,
    defaultBranch: string,
  ) => Promise<ImportJobStatus | Response>;
};

export type Options = {
  configApi: ConfigApi;
  identityApi: IdentityApi;
};

// @public
export const bulkImportApiRef = createApiRef<BulkImportAPI>({
  id: 'plugin.bulk-import.service',
});
