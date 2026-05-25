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

import type { Config } from '@backstage/config';
import type { AdminConfigService } from '../services/AdminConfigService';

export interface K8sCredentials {
  apiUrl: string;
  token: string;
}

/**
 * Resolves OpenShift/K8s API credentials.
 * Reads from `augment.k8s.apiUrl` / `augment.k8s.token` in Backstage config
 * first, then falls back to `devSpacesApiUrl` / `devSpacesToken` admin config
 * keys (legacy naming from DevSpaces feature).
 */
export async function resolveK8sCredentials(
  config: Config,
  adminConfig?: AdminConfigService,
): Promise<K8sCredentials | undefined> {
  const section = config.getOptionalConfig('augment.k8s');
  let apiUrl = section?.getOptionalString('apiUrl');
  let token = section?.getOptionalString('token');

  if (!apiUrl && adminConfig) {
    apiUrl =
      ((await adminConfig.get('devSpacesApiUrl')) as string) || undefined;
  }
  if (!token && adminConfig) {
    token = ((await adminConfig.get('devSpacesToken')) as string) || undefined;
  }

  apiUrl = apiUrl?.replace(/\/$/, '');
  if (!apiUrl || !token) return undefined;

  return { apiUrl, token };
}
