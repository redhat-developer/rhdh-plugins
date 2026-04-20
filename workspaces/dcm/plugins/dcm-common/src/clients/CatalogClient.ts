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
  CatalogItem,
  CatalogItemInstance,
  CatalogItemInstanceList,
  CatalogItemList,
  ServiceType,
  ServiceTypeList,
} from '../types/catalog';
import type { CatalogApi } from './CatalogApi';
import { DcmBaseClient } from './DcmBaseClient';

/**
 * Calls the DCM Catalog API through the dcm-backend secure proxy.
 *
 * All requests are sent to `/api/dcm/proxy/<path>` where the backend
 * strips the `/proxy` prefix and forwards to:
 *   `{dcm.apiGatewayUrl}/api/v1alpha1/<path>`
 *
 * @public
 */
export class CatalogClient extends DcmBaseClient implements CatalogApi {
  protected readonly serviceName = 'Catalog';

  // ── Service Types ──────────────────────────────────────────────────────────

  async listServiceTypes(): Promise<ServiceTypeList> {
    return this.fetch<ServiceTypeList>('service-types');
  }

  async getServiceType(serviceTypeId: string): Promise<ServiceType> {
    return this.fetch<ServiceType>(`service-types/${serviceTypeId}`);
  }

  async createServiceType(serviceType: ServiceType): Promise<ServiceType> {
    return this.fetch<ServiceType>('service-types', {
      method: 'POST',
      body: JSON.stringify(serviceType),
    });
  }

  // ── Catalog Items ──────────────────────────────────────────────────────────

  async listCatalogItems(): Promise<CatalogItemList> {
    return this.fetch<CatalogItemList>('catalog-items');
  }

  async getCatalogItem(catalogItemId: string): Promise<CatalogItem> {
    return this.fetch<CatalogItem>(`catalog-items/${catalogItemId}`);
  }

  async createCatalogItem(catalogItem: CatalogItem): Promise<CatalogItem> {
    return this.fetch<CatalogItem>('catalog-items', {
      method: 'POST',
      body: JSON.stringify(catalogItem),
    });
  }

  async updateCatalogItem(
    catalogItemId: string,
    patch: Partial<CatalogItem>,
  ): Promise<CatalogItem> {
    return this.fetch<CatalogItem>(`catalog-items/${catalogItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(patch),
    });
  }

  async deleteCatalogItem(catalogItemId: string): Promise<void> {
    return this.fetch<void>(`catalog-items/${catalogItemId}`, {
      method: 'DELETE',
    });
  }

  // ── Catalog Item Instances ─────────────────────────────────────────────────

  async listCatalogItemInstances(): Promise<CatalogItemInstanceList> {
    return this.fetch<CatalogItemInstanceList>('catalog-item-instances');
  }

  async getCatalogItemInstance(
    catalogItemInstanceId: string,
  ): Promise<CatalogItemInstance> {
    return this.fetch<CatalogItemInstance>(
      `catalog-item-instances/${catalogItemInstanceId}`,
    );
  }

  async createCatalogItemInstance(
    instance: CatalogItemInstance,
  ): Promise<CatalogItemInstance> {
    return this.fetch<CatalogItemInstance>('catalog-item-instances', {
      method: 'POST',
      body: JSON.stringify(instance),
    });
  }

  async deleteCatalogItemInstance(
    catalogItemInstanceId: string,
  ): Promise<void> {
    return this.fetch<void>(`catalog-item-instances/${catalogItemInstanceId}`, {
      method: 'DELETE',
    });
  }
}
