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

interface HomepageDefaultWidgetVisibilityConfig {
  /** User entity refs that grant visibility (OR within list). */
  users?: string[];
  /** Group entity refs that grant visibility (OR within list). */
  groups?: string[];
  /** Named Backstage permissions that grant visibility when allowed (OR within list). */
  permissions?: string[];
}

interface HomepageDefaultWidgetLayout {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface HomepageDefaultWidgetNodeConfig {
  /** Stable card identifier matched against frontend mount-point ids. Present for leaves. */
  id?: string;
  /** Arbitrary component props forwarded to the card. */
  props?: Record<string, unknown>;
  /** Responsive layout per breakpoint (xl, lg, md, sm, xs, xxs). */
  layouts?: Record<string, HomepageDefaultWidgetLayout>;
  /** Child nodes. Presence makes this a group; must be omitted when `id` is set. */
  children?: HomepageDefaultWidgetNodeConfig[];
  /** Optional visibility constraints; omitted or empty means visible to all. */
  if?: HomepageDefaultWidgetVisibilityConfig;
}

export interface Config {
  homepage?: {
    /**
     * Recursive default card tree rendered on the homepage. Each node is either
     * a leaf (has `id`) or a group (has `children`).
     */
    defaultWidgets?: HomepageDefaultWidgetNodeConfig[];
  };
}
