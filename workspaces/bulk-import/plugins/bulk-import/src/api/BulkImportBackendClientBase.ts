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

export interface IBulkImportRESTPathProvider {
  getCreateImportJobsPath(dryRun?: boolean): string | undefined;
  getDeleteImportActionPath(
    repo: string,
    defaultBranch: string,
    approvalTool?: string,
  ): string;
  getGetImportActionPath(
    repo: string,
    defaultBranch: string,
    approvalTool?: string,
  ): string;
  getGetImportJobsPath(
    page: number,
    size: number,
    searchString: string,
    sortColumn: AddedRepositoryColumnNameEnum,
    sortOrder: SortingOrderEnum,
  ): string;
  getSCMHostPath(): string;
}

export abstract class BulkImportRESTPathProviderBase implements IBulkImportRESTPathProvider {
  abstract getCreateImportJobsPath(dryRun?: boolean): string | undefined;
  abstract getDeleteImportActionPath(
    repo: string,
    defaultBranch: string,
    approvalTool?: string,
  ): string;
  abstract getGetImportActionPath(
    repo: string,
    defaultBranch: string,
    approvalTool?: string,
  ): string;
  abstract getGetImportJobsPath(
    page: number,
    size: number,
    searchString: string,
    sortColumn: AddedRepositoryColumnNameEnum,
    sortOrder: SortingOrderEnum,
  ): string;

  getSCMHostPath(): string {
    return `/api/bulk-import/scm-hosts`;
  }
}
