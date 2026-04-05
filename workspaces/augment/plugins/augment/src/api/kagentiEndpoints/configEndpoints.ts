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
  KagentiFeatureFlags,
  KagentiDashboardConfig,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { KagentiApiDeps } from './types';

// =============================================================================
// Health & Config
// =============================================================================

export async function getHealth(
  deps: KagentiApiDeps,
): Promise<{ health: string; ready: boolean }> {
  return deps.fetchJson('/kagenti/health');
}

export async function getFeatureFlags(
  deps: KagentiApiDeps,
): Promise<KagentiFeatureFlags> {
  return deps.fetchJson('/kagenti/config/features');
}

export async function getDashboards(
  deps: KagentiApiDeps,
): Promise<KagentiDashboardConfig> {
  return deps.fetchJson('/kagenti/config/dashboards');
}

// =============================================================================
// Namespaces
// =============================================================================

export async function listNamespaces(
  deps: KagentiApiDeps,
  enabledOnly = true,
): Promise<{ namespaces: string[]; defaultNamespace?: string }> {
  const qs = enabledOnly ? '?enabled_only=true' : '';
  return deps.fetchJson(`/kagenti/namespaces${qs}`);
}
