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

/**
 * Interface for the DCM Catalog API client.
 *
 * @public
 */
export interface CatalogApi {
  // Service Types
  listServiceTypes(): Promise<ServiceTypeList>;
  getServiceType(serviceTypeId: string): Promise<ServiceType>;
  createServiceType(serviceType: ServiceType): Promise<ServiceType>;

  // Catalog Items
  listCatalogItems(): Promise<CatalogItemList>;
  getCatalogItem(catalogItemId: string): Promise<CatalogItem>;
  createCatalogItem(catalogItem: CatalogItem): Promise<CatalogItem>;
  updateCatalogItem(
    catalogItemId: string,
    patch: Partial<CatalogItem>,
  ): Promise<CatalogItem>;
  deleteCatalogItem(catalogItemId: string): Promise<void>;

  // Catalog Item Instances
  listCatalogItemInstances(): Promise<CatalogItemInstanceList>;
  getCatalogItemInstance(
    catalogItemInstanceId: string,
  ): Promise<CatalogItemInstance>;
  createCatalogItemInstance(
    instance: CatalogItemInstance,
  ): Promise<CatalogItemInstance>;
  /**
   * Triggers catalog item instance rehydrate (placement); may assign a new resource id.
   *
   * @public
   */
  rehydrateCatalogItemInstance(
    catalogItemInstanceId: string,
  ): Promise<CatalogItemInstance>;
  deleteCatalogItemInstance(catalogItemInstanceId: string): Promise<void>;
}
