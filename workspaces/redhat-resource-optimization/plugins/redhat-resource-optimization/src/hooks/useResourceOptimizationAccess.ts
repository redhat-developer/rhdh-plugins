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

import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import { resourceOptimizationAccessApiRef } from '../apis';

/**
 * Return type of {@link useResourceOptimizationAccess}.
 * @public
 */
export interface UseResourceOptimizationAccessResult {
  /** Whether the user has access to the Optimizations section. */
  optimizationsAllowed: boolean;
  /** Whether the user has access to the OpenShift (Cost Management) section. */
  costManagementAllowed: boolean;
  /** True while access is being fetched. */
  loading: boolean;
  /** Set if fetching access failed. */
  error?: Error;
}

/**
 * Hook to fetch RBAC access for Optimizations and OpenShift (Cost Management).
 * Use in sidebar to show/hide items and in Router to guard routes.
 * @public
 */
export function useResourceOptimizationAccess(): UseResourceOptimizationAccessResult {
  const accessApi = useApi(resourceOptimizationAccessApiRef);

  const { value, loading, error } = useAsync(async () => {
    const [optimizationsAllowed, costManagementAllowed] = await Promise.all([
      accessApi.getOptimizationsAccess(),
      accessApi.getCostManagementAccess(),
    ]);
    return { optimizationsAllowed, costManagementAllowed };
  }, [accessApi]);

  return {
    optimizationsAllowed: value?.optimizationsAllowed ?? false,
    costManagementAllowed: value?.costManagementAllowed ?? false,
    loading,
    error,
  };
}
