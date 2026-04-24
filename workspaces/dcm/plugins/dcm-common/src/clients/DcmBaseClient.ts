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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { DcmClientError } from '../errors/DcmClientError';

const PLUGIN_ID = 'dcm';

/**
 * Base class shared by all DCM API clients.
 *
 * Routes every call through the dcm-backend secure proxy:
 *   `GET /api/dcm/proxy/<path>` → `{dcm.apiGatewayUrl}/api/v1alpha1/<path>`
 *
 * @public
 */
export abstract class DcmBaseClient {
  protected readonly discoveryApi: DiscoveryApi;
  protected readonly fetchApi: FetchApi;

  /** Human-readable service name used in error messages, e.g. "Catalog". */
  protected abstract readonly serviceName: string;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  protected async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl(PLUGIN_ID);
    const url = `${baseUrl}/proxy/${path}`;
    const { headers: initHeaders, ...initRest } = init ?? {};
    const response = await this.fetchApi.fetch(url, {
      ...initRest,
      headers: { 'Content-Type': 'application/json', ...initHeaders },
    });
    if (response.status === 204) {
      return undefined as unknown as T;
    }
    if (!response.ok) {
      const text = await response.text();
      throw DcmClientError.fromResponse(
        this.serviceName,
        response.status,
        text,
      );
    }
    return response.json() as Promise<T>;
  }
}
