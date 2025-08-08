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
import { readSchedulerServiceTaskScheduleDefinitionFromConfig } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

import type { ModelCatalogConfig } from './types';

/**
 * readModelCatalogApiEntityConfigs reads the configuration for the ModelCatalog provider
 *
 * @public
 */
export function readModelCatalogApiEntityConfigs(
  config: Config,
): ModelCatalogConfig[] {
  const providerConfigs = config.getOptionalConfig(
    'catalog.providers.modelCatalog',
  );
  if (!providerConfigs) {
    return [];
  }
  return providerConfigs
    .keys()
    .map(id =>
      readModelCatalogApiEntityConfig(id, providerConfigs.getConfig(id)),
    );
}

function readModelCatalogApiEntityConfig(
  id: string,
  config: Config,
): ModelCatalogConfig {
  const baseUrl = config.getString('baseUrl');

  const schedule = config.has('schedule')
    ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
        config.getConfig('schedule'),
      )
    : undefined;

  return {
    id,
    baseUrl,
    schedule,
  };
}
