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

/**
 * Full resource representation.
 * Based on the Placement Management API schema (placement.yaml).
 * @public
 */
export interface Resource {
  /** Unique identifier (readOnly, server-generated or client-provided via query param). */
  id?: string;
  /** Resource path identifier (readOnly). */
  path?: string;
  /** Name of the assigned Service Provider (readOnly). */
  provider_name?: string;
  /** The catalog item instance this resource was created from. */
  catalog_item_instance_id: string;
  /** Service specification JSON — must have at least one property. */
  spec: Record<string, unknown>;
  /** Approval status returned by the Policy Engine (readOnly). */
  approval_status?: string;
  /** ISO 8601 creation timestamp (readOnly). */
  create_time?: string;
  /** ISO 8601 last-update timestamp (readOnly). */
  update_time?: string;
}

/**
 * Paginated list of resources.
 * @public
 */
export interface ResourceList {
  resources: Resource[];
  next_page_token?: string;
}

/**
 * Request body for the rehydrate operation.
 * @public
 */
export interface RehydrateRequest {
  new_resource_id: string;
}
