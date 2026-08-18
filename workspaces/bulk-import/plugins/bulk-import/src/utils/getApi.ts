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

import { APITypes } from '../types';

/** Builds bulk-import backend list URLs (kept out of repository-utils UI graph). */
export const getApi = (
  backendUrl: string,
  page: number,
  size: number,
  searchString: string,
  approvalTool: string,
  options?: APITypes,
) => {
  const params = new URLSearchParams({
    pagePerIntegration: String(page),
    sizePerIntegration: String(size),
    search: searchString,
    approvalTool,
  });

  if (options?.fetchOrganizations) {
    return `${backendUrl}/api/bulk-import/organizations?${params.toString()}`;
  }
  if (options?.orgName) {
    const orgName = encodeURIComponent(options?.orgName);
    return `${backendUrl}/api/bulk-import/organizations/${orgName}/repositories?${params.toString()}`;
  }
  return `${backendUrl}/api/bulk-import/repositories?${params.toString()}`;
};
