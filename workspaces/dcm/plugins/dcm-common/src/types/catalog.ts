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
 * DCM Catalog API types — derived from dcm-catalog OpenAPI spec.
 *
 * @public
 */

/** A service type definition. */
export interface ServiceType {
  /** Unique identifier (readOnly). */
  uid?: string;
  api_version: string;
  service_type: string;
  metadata?: {
    labels?: Record<string, string>;
  };
  /** Opaque dictionary — implementation-defined fields. */
  spec: Record<string, unknown>;
  /** Resource path (readOnly). */
  path?: string;
  create_time?: string;
  update_time?: string;
}

/** A catalog item (template for instances). */
export interface CatalogItem {
  uid?: string;
  api_version?: string;
  display_name?: string;
  spec?: CatalogItemSpec;
  path?: string;
  create_time?: string;
  update_time?: string;
}

/** Spec section of a {@link CatalogItem}. */
export interface CatalogItemSpec {
  service_type?: string;
  fields?: FieldConfiguration[];
}

/** A single field within a {@link CatalogItemSpec}. */
export interface FieldConfiguration {
  path: string;
  display_name?: string;
  editable?: boolean;
  /** Any JSON value — use `unknown` for strict typing. */
  default?: unknown;
  validation_schema?: Record<string, unknown>;
  depends_on?: FieldConfigurationDependsOn;
}

/** Conditional display rule for a {@link FieldConfiguration}. */
export interface FieldConfigurationDependsOn {
  path: string;
  allowed_values: Record<string, unknown[]>;
}

/** A provisioned instance of a {@link CatalogItem}. */
export interface CatalogItemInstance {
  uid?: string;
  api_version: string;
  display_name: string;
  spec: CatalogItemInstanceSpec;
  /** External resource identifier (readOnly). */
  resource_id?: string;
  path?: string;
  create_time?: string;
  update_time?: string;
}

/** Spec section of a {@link CatalogItemInstance}. */
export interface CatalogItemInstanceSpec {
  catalog_item_id: string;
  user_values: UserValue[];
}

/** A user-supplied value for a field in a {@link CatalogItemInstanceSpec}. */
export interface UserValue {
  path: string;
  value: unknown;
}

/** Paginated list of {@link ServiceType} resources. */
export interface ServiceTypeList {
  results: ServiceType[];
  next_page_token: string;
}

/** Paginated list of {@link CatalogItem} resources. */
export interface CatalogItemList {
  results: CatalogItem[];
  next_page_token: string;
}

/** Paginated list of {@link CatalogItemInstance} resources. */
export interface CatalogItemInstanceList {
  results: CatalogItemInstance[];
  next_page_token: string;
}
