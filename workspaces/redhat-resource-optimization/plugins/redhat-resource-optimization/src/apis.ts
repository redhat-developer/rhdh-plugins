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
import {
  type OptimizationsApi,
  type OrchestratorSlimApi,
  type CostManagementSlimApi,
} from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';

/** @public */
export const optimizationsApiRef = createApiRef<OptimizationsApi>({
  id: 'plugin.redhat-resource-optimization.api',
});

/** @public */
export const orchestratorSlimApiRef = createApiRef<OrchestratorSlimApi>({
  id: 'plugin.redhat-orchestrator-slim.api',
});

/** @public */
export const costManagementSlimApiRef = createApiRef<CostManagementSlimApi>({
  id: 'plugin.redhat-cost-management-slim.api',
});

/**
 * API for checking RBAC access to Optimizations and OpenShift (Cost Management) sections.
 * Used by the sidebar to show/hide items and by the Router to guard routes.
 * @public
 */
export interface ResourceOptimizationAccessApi {
  /** Returns true if the user has access to the Optimizations section. */
  getOptimizationsAccess(): Promise<boolean>;
  /** Returns true if the user has access to the OpenShift (Cost Management) section. */
  getCostManagementAccess(): Promise<boolean>;
}

/**
 * API ref for {@link ResourceOptimizationAccessApi}.
 * @public
 */
export const resourceOptimizationAccessApiRef =
  createApiRef<ResourceOptimizationAccessApi>({
    id: 'plugin.redhat-resource-optimization.access',
  });
