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
import { AuthService, PermissionsService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { CatalogMetricService } from '../service/CatalogMetricService';
import { createGetEntityMetricsAction } from './getEntityMetrics';
import { createListMetricsAction } from './listMetrics';

export { createGetEntityMetricsAction } from './getEntityMetrics';
export { createListMetricsAction } from './listMetrics';

export const createScorecardActions = (options: {
  actionsRegistry: ActionsRegistryService;
  auth: AuthService;
  permissions: PermissionsService;
  catalog: CatalogService;
  metricProvidersRegistry: MetricProvidersRegistry;
  catalogMetricService: CatalogMetricService;
}) => {
  createGetEntityMetricsAction(options);
  createListMetricsAction(options);
};
