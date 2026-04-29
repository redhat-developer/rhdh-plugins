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
import type {
  CatalogApi,
  PolicyManagerApi,
  ProvidersApi,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';

/**
 * Backstage API ref for the DCM Catalog service.
 *
 * Provides CRUD operations for ServiceTypes, CatalogItems, and
 * CatalogItemInstances via the dcm-backend secure proxy.
 *
 * @public
 */
export const catalogApiRef = createApiRef<CatalogApi>({
  id: 'plugin.dcm.catalog',
});

/**
 * Backstage API ref for the DCM Policy Manager service.
 *
 * Provides CRUD operations for Policies via the dcm-backend secure proxy.
 *
 * @public
 */
export const policyManagerApiRef = createApiRef<PolicyManagerApi>({
  id: 'plugin.dcm.policy-manager',
});

/**
 * Backstage API ref for the DCM Providers service.
 *
 * Provides CRUD operations for Providers via the dcm-backend secure proxy.
 *
 * @public
 */
export const providersApiRef = createApiRef<ProvidersApi>({
  id: 'plugin.dcm.providers',
});
