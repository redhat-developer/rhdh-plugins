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

import type { Provider, ProviderList } from '../types/providers';
import type { ProvidersApi } from './ProvidersApi';
import { DcmBaseClient } from './DcmBaseClient';

/**
 * Calls the DCM Providers API through the dcm-backend secure proxy.
 *
 * All requests are sent to `/api/dcm/proxy/<path>` where the backend
 * strips the `/proxy` prefix and forwards to:
 *   `{dcm.apiGatewayUrl}/api/v1alpha1/<path>`
 *
 * @public
 */
export class ProvidersClient extends DcmBaseClient implements ProvidersApi {
  protected readonly serviceName = 'Providers';

  async listProviders(): Promise<ProviderList> {
    return this.fetch<ProviderList>('providers');
  }

  async getProvider(providerId: string): Promise<Provider> {
    return this.fetch<Provider>(`providers/${providerId}`);
  }

  async createProvider(provider: Provider): Promise<Provider> {
    return this.fetch<Provider>('providers', {
      method: 'POST',
      body: JSON.stringify(provider),
    });
  }

  async applyProvider(
    providerId: string,
    provider: Provider,
  ): Promise<Provider> {
    return this.fetch<Provider>(`providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify(provider),
    });
  }

  async deleteProvider(providerId: string): Promise<void> {
    return this.fetch<void>(`providers/${providerId}`, { method: 'DELETE' });
  }
}
