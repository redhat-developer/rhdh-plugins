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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { KagentiApiClient } from './client/KagentiApiClient';
import type { KagentiConfig } from './config/KagentiConfigLoader';

/**
 * Resolves the list of Kagenti namespaces visible to this Backstage instance
 * based on the allow-list, showAllNamespaces flag, and the default namespace.
 *
 * Shared between KagentiProvider.listModels and kagentiRoutes agent/tool list handlers.
 */
export async function getVisibleNamespaces(
  apiClient: KagentiApiClient,
  config: KagentiConfig,
  logger: LoggerService,
): Promise<string[]> {
  try {
    const nsResp = await apiClient.listNamespaces();
    let namespaces = nsResp.namespaces;

    if (config.namespaces?.length) {
      const allowSet = new Set(config.namespaces);
      namespaces = namespaces.filter(ns => allowSet.has(ns));
    } else if (!config.showAllNamespaces) {
      namespaces = [config.namespace];
    }

    return namespaces;
  } catch (err) {
    logger.warn(
      `Failed to list namespaces, falling back to default: ${err instanceof Error ? err.message : err}`,
    );
    return [config.namespace];
  }
}
