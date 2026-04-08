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

import type {
  DevSpacesCreateWorkspaceRequest,
  DevSpacesCreateWorkspaceResponse,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { KagentiApiDeps } from './types';
import { jsonBody } from './types';

/**
 * Create a Dev Spaces workspace via the backend proxy.
 * The OpenShift token is sent as a custom header so the backend
 * can forward it to the Dev Spaces API without storing it.
 */
export async function createDevSpacesWorkspace(
  deps: KagentiApiDeps,
  request: DevSpacesCreateWorkspaceRequest,
  token: string,
): Promise<DevSpacesCreateWorkspaceResponse> {
  const init = jsonBody(request);
  init.headers = {
    ...(init.headers as Record<string, string>),
    'x-devspaces-token': token,
  };
  return deps.fetchJson('/devspaces/workspaces', init);
}
