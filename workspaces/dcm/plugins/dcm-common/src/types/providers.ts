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
 * DCM Providers API types — derived from providers OpenAPI spec.
 *
 * @public
 */

/** Capacity metrics for a provider's infrastructure. */
export interface ResourceCapacity {
  total_cpu?: number;
  total_memory?: string;
  total_storage?: string;
  total_node?: number;
}

/** Provider metadata — includes optional open-ended extra fields. */
export interface ProviderMetadata {
  region_code?: string;
  zone?: string;
  status?: string;
  resources?: ResourceCapacity;
  [key: string]: unknown;
}

/** Lifecycle status of a registered provider (readOnly). */
export type ProviderStatus = 'registered' | 'updated';

/** A service provider registered with DCM. */
export interface Provider {
  /** Unique identifier (readOnly). */
  id?: string;
  /** Resource path (readOnly). */
  path?: string;
  name: string;
  display_name?: string;
  /** Provider API endpoint URI. */
  endpoint: string;
  service_type: string;
  /** API schema version supported by this provider (e.g. `v1alpha1`). */
  schema_version: string;
  /** List of supported operation names. */
  operations?: string[];
  metadata?: ProviderMetadata;
  /** Lifecycle status set by the server (readOnly). */
  status?: ProviderStatus;
  health_status?: string;
  create_time?: string;
  update_time?: string;
}

/** Paginated list of {@link Provider} resources. */
export interface ProviderList {
  providers?: Provider[];
  next_page_token?: string;
}
