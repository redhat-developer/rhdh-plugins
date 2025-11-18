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

import { ClusterError } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { useMemo } from 'react';

/**
 * Determines if all clusters have failed based on loaded state, data, and cluster errors
 *
 * @param loaded - Whether data has finished loading
 * @param data - The data array (can be undefined or empty)
 * @param clusterErrors - Array of cluster errors (can be undefined or empty)
 * @returns true if all clusters failed (loaded, no data, and has errors)
 */
export const useAllClustersFailed = <T>(
  loaded: boolean,
  data: T[] | undefined,
  clusterErrors: ClusterError[] | undefined,
): boolean => {
  return useMemo(() => {
    return (
      loaded &&
      (!data || data.length === 0) &&
      clusterErrors !== undefined &&
      clusterErrors.length > 0
    );
  }, [loaded, data, clusterErrors]);
};
