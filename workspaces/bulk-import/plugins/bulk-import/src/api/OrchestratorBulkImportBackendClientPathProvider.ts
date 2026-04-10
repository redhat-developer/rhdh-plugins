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

import { BulkImportRESTPathProviderBase } from './BulkImportBackendClientBase';

export class OrchestratorBulkImportBackendClientPathProvider extends BulkImportRESTPathProviderBase {
  getCreateImportJobsPath(dryRun?: boolean): string | undefined {
    return dryRun === true
      ? undefined
      : `/api/bulk-import/orchestrator-workflows`;
  }

  getImportActionPath(
    repo: string,
    _defaultBranch: string,
    approvalTool?: string,
  ): string {
    const params = new URLSearchParams({ repo });
    if (approvalTool) params.set('approvalTool', approvalTool);
    return `/api/bulk-import/orchestrator-import/by-repo?${params.toString()}`;
  }

  protected getImportJobsBasePath(): string {
    return `/api/bulk-import/orchestrator-workflows`;
  }
}
