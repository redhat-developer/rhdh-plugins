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
  ListServiceTypeInstancesParams,
  ServiceTypeInstanceList,
} from '../types/resources';

/**
 * Client interface for the DCM Resources (service-type-instances) API.
 *
 * @public
 */
export interface ResourcesApi {
  /**
   * Returns a paginated list of service type instances.
   * Maps to `GET /service-type-instances`.
   */
  listServiceTypeInstances(
    params?: ListServiceTypeInstancesParams,
  ): Promise<ServiceTypeInstanceList>;
}
