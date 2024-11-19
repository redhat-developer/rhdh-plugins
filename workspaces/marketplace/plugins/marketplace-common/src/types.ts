/*
 * Copyright 2024 The Backstage Authors
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
 * @public
 */
export interface MarketplacePluginEntry {
  metadata: MarketplacePluginMetadata;
  spec?: MarketplacePluginSpec;
}

/**
 * @public
 */
export interface MarketplacePluginMetadata {
  // primary identifier
  name: string;

  // primary display name
  title: string;

  abstract?: string;

  categories?: string[];
  developer?: string;

  // TODO: support for light/dark icon
  icon?: string;

  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  tags?: string[];
  links?: MarketplacePluginLink[];
}

/**
 * @public
 */
export interface MarketplacePluginLink {
  url: string;
  title?: string;
  icon?: string;
  type?: string;
}

/**
 * @public
 */
export interface MarketplacePluginSpec {
  highlights?: string[];
  description?: string;
  installation?: {
    markdown?: string;
    appconfig?: string;
  };
}
