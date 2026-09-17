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

import { createApiRef } from '@backstage/core-plugin-api';
import type { ApiRef } from '@backstage/core-plugin-api';
import type {
  AgentsApi,
  CatalogApi,
  PolicyManagerApi,
  ResourcesApi,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';

/**
 * Backstage API ref for the DCM Catalog service.
 *
 * Provides CRUD operations for ServiceTypes, CatalogItems, and
 * CatalogItemInstances via the dcm-backend secure proxy.
 *
 * @public
 */
export const catalogApiRef: ApiRef<CatalogApi> = createApiRef<CatalogApi>({
  id: 'plugin.dcm.catalog',
});

/**
 * Backstage API ref for the DCM Policy Manager service.
 *
 * Provides CRUD operations for Policies via the dcm-backend secure proxy.
 *
 * @public
 */
export const policyManagerApiRef: ApiRef<PolicyManagerApi> =
  createApiRef<PolicyManagerApi>({
    id: 'plugin.dcm.policy-manager',
  });

/**
 * Backstage API ref for the DCM Agents service.
 *
 * Provides operations for listing and registering environment agents via
 * the dcm-backend secure proxy.
 *
 * @public
 */
export const agentsApiRef: ApiRef<AgentsApi> = createApiRef<AgentsApi>({
  id: 'plugin.dcm.agents',
});

/**
 * Backstage API ref for the DCM Resources service.
 *
 * Provides read access to service type instances via the dcm-backend secure proxy.
 *
 * @public
 */
export const resourcesApiRef: ApiRef<ResourcesApi> = createApiRef<ResourcesApi>(
  {
    id: 'plugin.dcm.resources',
  },
);
