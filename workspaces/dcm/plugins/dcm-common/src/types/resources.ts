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
 * DCM Resources API types — derived from the service-type-instances OpenAPI spec.
 *
 * @public
 */

/** Spec payload of a {@link ServiceTypeInstance}. */
export interface ServiceTypeInstanceSpec {
  /** The service type this instance belongs to (e.g. "vm"). */
  service_type?: string;
  [key: string]: unknown;
}

/** A provisioned service type instance managed by DCM. */
export interface ServiceTypeInstance {
  /** Unique identifier (readOnly). */
  id: string;
  /** Resource path (readOnly). */
  path?: string;
  /** The provider that manages this instance. */
  provider_name?: string;
  /** Instance spec containing service_type and other provider-specific fields. */
  spec?: ServiceTypeInstanceSpec;
  /** Current lifecycle status. */
  status?: string;
  /** Whether this instance has been soft-deleted. */
  deleted?: boolean;
  create_time?: string;
  update_time?: string;
  delete_time?: string;
}

/** Paginated list of {@link ServiceTypeInstance} resources. */
export interface ServiceTypeInstanceList {
  instances?: ServiceTypeInstance[];
  next_page_token?: string;
}

/** Query parameters accepted by the list endpoint. */
export interface ListServiceTypeInstancesParams {
  /** Filter by service provider name. */
  provider?: string;
  /** When true, soft-deleted instances are included alongside active ones. */
  show_deleted?: boolean;
  /** Maximum number of results per page (1–100, default 100). */
  max_page_size?: number;
  /** Opaque pagination token returned by a previous response. */
  page_token?: string;
}
