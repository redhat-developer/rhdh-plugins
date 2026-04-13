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

/**
 * Interface for the DCM Providers API client.
 *
 * @public
 */
export interface ProvidersApi {
  listProviders(): Promise<ProviderList>;
  getProvider(providerId: string): Promise<Provider>;
  createProvider(provider: Provider): Promise<Provider>;
  applyProvider(providerId: string, provider: Provider): Promise<Provider>;
  deleteProvider(providerId: string): Promise<void>;
}
