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
import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'dcm',
});

export const serviceSpecsRouteRef = createSubRouteRef({
  id: 'dcm-service-specs',
  parent: rootRouteRef,
  path: '/service-specs',
});

export const environmentDetailsRouteRef = createSubRouteRef({
  id: 'dcm-environment-details',
  parent: rootRouteRef,
  path: '/environments/:id',
});

export const serviceSpecDetailsRouteRef = createSubRouteRef({
  id: 'dcm-service-spec-details',
  parent: rootRouteRef,
  path: '/service-specs/:id',
});

export const DCM_DETAILS_TABS = {
  overview: '/',
  entities: '/entities',
  requestHistory: '/request-history',
} as const;

// ── API-aligned tab route refs ─────────────────────────────────────────────

export const providersRouteRef = createSubRouteRef({
  id: 'dcm-providers',
  parent: rootRouteRef,
  path: '/providers',
});

export const policiesRouteRef = createSubRouteRef({
  id: 'dcm-policies',
  parent: rootRouteRef,
  path: '/policies',
});

export const serviceTypesRouteRef = createSubRouteRef({
  id: 'dcm-service-types',
  parent: rootRouteRef,
  path: '/service-types',
});

export const catalogItemsRouteRef = createSubRouteRef({
  id: 'dcm-catalog-items',
  parent: rootRouteRef,
  path: '/catalog-items',
});

export const catalogItemInstancesRouteRef = createSubRouteRef({
  id: 'dcm-catalog-item-instances',
  parent: rootRouteRef,
  path: '/catalog-item-instances',
});

export const resourcesRouteRef = createSubRouteRef({
  id: 'dcm-resources',
  parent: rootRouteRef,
  path: '/resources',
});
