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
  Resource,
  ResourceList,
  RehydrateRequest,
} from '../types/placement';
import type { PlacementApi } from './PlacementApi';
import { DcmBaseClient } from './DcmBaseClient';

/**
 * Calls the DCM Placement Manager API through the dcm-backend secure proxy.
 *
 * All requests are sent to `/api/dcm/proxy/<path>` where the backend
 * strips the `/proxy` prefix and forwards to:
 *   `{dcm.apiGatewayUrl}/api/v1alpha1/<path>`
 *
 * @public
 */
export class PlacementClient extends DcmBaseClient implements PlacementApi {
  protected readonly serviceName = 'Placement';

  async listResources(options?: {
    provider?: string;
    maxPageSize?: number;
    pageToken?: string;
  }): Promise<ResourceList> {
    const params = new URLSearchParams();
    if (options?.provider) params.set('provider', options.provider);
    if (options?.maxPageSize)
      params.set('max_page_size', String(options.maxPageSize));
    if (options?.pageToken) params.set('page_token', options.pageToken);
    const qs = params.toString();
    const path = qs ? `resources?${qs}` : 'resources';
    return this.fetch<ResourceList>(path);
  }

  async getResource(resourceId: string): Promise<Resource> {
    return this.fetch<Resource>(`resources/${resourceId}`);
  }

  async createResource(resource: Resource, id?: string): Promise<Resource> {
    const qs = id ? `?id=${encodeURIComponent(id)}` : '';
    return this.fetch<Resource>(`resources${qs}`, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  }

  async deleteResource(resourceId: string): Promise<void> {
    return this.fetch<void>(`resources/${resourceId}`, { method: 'DELETE' });
  }

  async rehydrateResource(
    resourceId: string,
    request: RehydrateRequest,
  ): Promise<Resource> {
    return this.fetch<Resource>(`resources/${resourceId}:rehydrate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}
