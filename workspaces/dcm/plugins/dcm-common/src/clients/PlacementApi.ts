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

/**
 * Interface for the DCM Placement Manager API client.
 *
 * @public
 */
export interface PlacementApi {
  /** GET /resources — list all resources, optionally filtered by provider. */
  listResources(options?: {
    provider?: string;
    maxPageSize?: number;
    pageToken?: string;
  }): Promise<ResourceList>;

  /** GET /resources/:resourceId — fetch a single resource. */
  getResource(resourceId: string): Promise<Resource>;

  /**
   * POST /resources — create a new resource.
   * @param resource - The resource body (catalog_item_instance_id + spec).
   * @param id       - Optional client-assigned resource ID (query param).
   */
  createResource(resource: Resource, id?: string): Promise<Resource>;

  /** DELETE /resources/:resourceId — delete a resource. */
  deleteResource(resourceId: string): Promise<void>;

  /** POST /resources/:resourceId:rehydrate — re-evaluate a resource against current policies. */
  rehydrateResource(
    resourceId: string,
    request: RehydrateRequest,
  ): Promise<Resource>;
}
