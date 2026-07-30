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

import type { KagentiApiClient } from './KagentiApiClient';
import type { DirectoryListing, FileContent, PodStorageStats } from './types';
import { SANDBOX_PREFIX as P, encodePathSegment as e } from './utils';

export function browseFiles(
  api: KagentiApiClient,
  namespace: string,
  agentName: string,
  path = '/',
): Promise<DirectoryListing | FileContent> {
  return api.request(
    'GET',
    `${P}/${e(namespace)}/files/${e(agentName)}?path=${e(path)}`,
  );
}

export function listDirectory(
  api: KagentiApiClient,
  namespace: string,
  agentName: string,
  path = '/',
): Promise<DirectoryListing> {
  return api.request(
    'GET',
    `${P}/${e(namespace)}/files/${e(agentName)}/list?path=${e(path)}`,
  );
}

export function getFileContent(
  api: KagentiApiClient,
  namespace: string,
  agentName: string,
  path: string,
): Promise<FileContent> {
  return api.request(
    'GET',
    `${P}/${e(namespace)}/files/${e(agentName)}/content?path=${e(path)}`,
  );
}

export function browseContextFiles(
  api: KagentiApiClient,
  namespace: string,
  agentName: string,
  contextId: string,
  path = '/',
): Promise<DirectoryListing | FileContent> {
  return api.request(
    'GET',
    `${P}/${e(namespace)}/files/${e(agentName)}/${e(contextId)}?path=${e(path)}`,
  );
}

export function getStorageStats(
  api: KagentiApiClient,
  namespace: string,
  agentName: string,
): Promise<PodStorageStats> {
  return api.request('GET', `${P}/${e(namespace)}/stats/${e(agentName)}`);
}
