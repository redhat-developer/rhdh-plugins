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
import type {
  SidecarResponse,
  EnableSidecarRequest,
  SidecarConfigUpdateRequest,
} from './types';
import { SANDBOX_PREFIX as P, encodePathSegment as e } from './utils';

export function listSidecars(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
): Promise<SidecarResponse[]> {
  return api.request(
    'GET',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars`,
  );
}

export function enableSidecar(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
  opts?: EnableSidecarRequest,
): Promise<SidecarResponse> {
  return api.request(
    'POST',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/enable`,
    opts,
  );
}

export function disableSidecar(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
): Promise<{ status: string; sidecar_type: string }> {
  return api.request(
    'POST',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/disable`,
  );
}

export function updateSidecarConfig(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
  config: SidecarConfigUpdateRequest,
): Promise<SidecarResponse> {
  return api.request(
    'PUT',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/config`,
    config,
  );
}

export function resetSidecar(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
): Promise<Record<string, unknown>> {
  return api.request(
    'POST',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/reset`,
  );
}

export function streamObservations(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
  onLine: (line: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  return api.streamRequest(
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/observations`,
    {},
    onLine,
    signal,
  );
}

export function approveSidecar(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
  msgId: string,
): Promise<{ status: string; id: string }> {
  return api.request(
    'POST',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/approve/${e(msgId)}`,
  );
}

export function denySidecar(
  api: KagentiApiClient,
  namespace: string,
  contextId: string,
  sidecarType: string,
  msgId: string,
): Promise<{ status: string; id: string }> {
  return api.request(
    'POST',
    `${P}/${e(namespace)}/sessions/${e(contextId)}/sidecars/${e(sidecarType)}/deny/${e(msgId)}`,
  );
}
