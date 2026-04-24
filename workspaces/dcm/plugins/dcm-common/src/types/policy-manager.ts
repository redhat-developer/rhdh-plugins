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
 * DCM Policy Manager API types — derived from policy-manager OpenAPI spec.
 *
 * @public
 */

/** Scope of a policy: organisation-wide or user-scoped. */
export type PolicyType = 'GLOBAL' | 'USER';

/** A policy definition managed by the Policy Manager service. */
export interface Policy {
  /** Resource path (readOnly). */
  path?: string;
  /** Unique identifier (readOnly). */
  id?: string;
  display_name?: string;
  description?: string;
  policy_type?: PolicyType;
  /** Key-value labels used to match resources this policy applies to. */
  label_selector?: Record<string, string>;
  /** Evaluation priority — lower numbers evaluated first (1–1000, default 500). */
  priority?: number;
  /** Rego policy code evaluated by OPA. */
  rego_code?: string;
  enabled?: boolean;
  create_time?: string;
  update_time?: string;
}

/** Paginated list of {@link Policy} resources. */
export interface PolicyList {
  policies: Policy[];
  next_page_token?: string;
}
