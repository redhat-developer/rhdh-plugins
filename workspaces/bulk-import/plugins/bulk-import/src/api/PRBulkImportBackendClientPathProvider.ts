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

import { AddedRepositoryColumnNameEnum, SortingOrderEnum } from '../types';
import { IBulkImportRESTPathProvider } from './BulkImportBackendClient';

export class PRBulkImportBackendClientPathProvider
  implements IBulkImportRESTPathProvider
{
  getCreateImportJobsPath(dryRun?: boolean): string {
    return dryRun
      ? `/api/bulk-import/imports?dryRun=true`
      : `/api/bulk-import/imports`;
  }

  getDeleteImportActionPath(repo: string, defaultBranch: string): string {
    return `/api/bulk-import/import/by-repo?repo=${repo}&defaultBranch=${defaultBranch}`;
  }

  getGetImportActionPath(repo: string, defaultBranch: string): string {
    return `/api/bulk-import/import/by-repo?repo=${repo}&defaultBranch=${defaultBranch}`;
  }

  getGetImportJobsPath(
    page: number,
    size: number,
    searchString: string,
    sortColumn: AddedRepositoryColumnNameEnum,
    sortOrder: SortingOrderEnum,
  ): string {
    return `/api/bulk-import/imports?page=${page}&size=${size}&search=${searchString}&sortColumn=${sortColumn}&sortOrder=${sortOrder}`;
  }
}
