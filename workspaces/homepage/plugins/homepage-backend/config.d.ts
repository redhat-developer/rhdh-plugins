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

interface HomepageDefaultCardVisibilityConfig {
  /** User entity refs that grant visibility (OR within list). */
  users?: string[];
  /** Group entity refs that grant visibility (OR within list). */
  groups?: string[];
  /** Named Backstage permissions that grant visibility when allowed (OR within list). */
  permissions?: string[];
}

interface HomepageDefaultCardLayout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface HomepageDefaultCardNodeConfig {
  /** Stable card identifier matched against frontend mount-point ids. Present for leaves. */
  id?: string;
  /** Optional human-readable label for the card or group node. */
  label?: string;
  /** Display title for the card. */
  title?: string;
  /** Display description for the card. */
  description?: string;
  /** Ordering hint — higher values appear first. */
  priority?: number;
  /** Responsive layout per breakpoint (xl, lg, md, sm, xs, xxs). */
  layouts?: Record<string, HomepageDefaultCardLayout>;
  /** Child nodes. Presence makes this a group; must be omitted when `id` is set. */
  children?: HomepageDefaultCardNodeConfig[];
  /** Optional visibility constraints; omitted or empty means visible to all. */
  visibility?: HomepageDefaultCardVisibilityConfig;
}

export interface Config {
  homepage?: {
    /** Whether the homepage layout is customizable by the user. Defaults to false. */
    customizable?: boolean;
    /**
     * Recursive default card tree rendered on the homepage. Each node is either
     * a leaf (has `id`) or a group (has `children`).
     */
    defaultCards?: HomepageDefaultCardNodeConfig[];
  };
}
