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
  DevSpacesHealthResponse,
  DevSpacesListWorkspacesResponse,
  DevSpacesWorkspace,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { KagentiApiDeps } from './types';
import { jsonBody, e } from './types';

/**
 * Check Dev Spaces API health and configuration status.
 */
export async function checkDevSpacesHealth(
  deps: KagentiApiDeps,
): Promise<DevSpacesHealthResponse> {
  return deps.fetchJson('/devspaces/health');
}

/**
 * Create a Dev Spaces workspace via the backend proxy.
 * Authentication is handled server-side using the platform's
 * Keycloak credentials — no user-supplied token needed.
 */
export async function createDevSpacesWorkspace(
  deps: KagentiApiDeps,
  request: DevSpacesCreateWorkspaceRequest,
): Promise<DevSpacesCreateWorkspaceResponse> {
  return deps.fetchJson('/devspaces/workspaces', jsonBody(request));
}

/**
 * List workspaces in a namespace.
 */
export async function listDevSpacesWorkspaces(
  deps: KagentiApiDeps,
  namespace: string,
): Promise<DevSpacesListWorkspacesResponse> {
  return deps.fetchJson(`/devspaces/workspaces?namespace=${e(namespace)}`);
}

/**
 * Get a single workspace's status.
 */
export async function getDevSpacesWorkspace(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<DevSpacesWorkspace> {
  return deps.fetchJson(`/devspaces/workspaces/${e(namespace)}/${e(name)}`);
}

/**
 * Stop a running workspace.
 */
export async function stopDevSpacesWorkspace(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  await deps.fetchJson(
    `/devspaces/workspaces/${e(namespace)}/${e(name)}/stop`,
    { method: 'PATCH' },
  );
}

/**
 * Delete a workspace.
 */
export async function deleteDevSpacesWorkspace(
  deps: KagentiApiDeps,
  namespace: string,
  name: string,
): Promise<void> {
  await deps.fetchJson(`/devspaces/workspaces/${e(namespace)}/${e(name)}`, {
    method: 'DELETE',
  });
}
