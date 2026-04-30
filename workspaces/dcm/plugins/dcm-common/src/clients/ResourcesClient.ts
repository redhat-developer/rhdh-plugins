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

import { DcmBaseClient } from './DcmBaseClient';
import type { ResourcesApi } from './ResourcesApi';
import type {
  ListServiceTypeInstancesParams,
  ServiceTypeInstanceList,
} from '../types/resources';

/**
 * Default implementation of {@link ResourcesApi}.
 *
 * Routes calls through the dcm-backend secure proxy to the
 * `/service-type-instances` endpoint of the DCM API Gateway.
 *
 * @public
 */
export class ResourcesClient extends DcmBaseClient implements ResourcesApi {
  protected readonly serviceName = 'Resources';

  /** @public */
  async listServiceTypeInstances(
    params: ListServiceTypeInstancesParams = {},
  ): Promise<ServiceTypeInstanceList> {
    const query = new URLSearchParams();
    if (params.provider !== undefined) query.set('provider', params.provider);
    if (params.show_deleted !== undefined)
      query.set('show_deleted', String(params.show_deleted));
    if (params.max_page_size !== undefined)
      query.set('max_page_size', String(params.max_page_size));
    if (params.page_token !== undefined)
      query.set('page_token', params.page_token);
    const qs = query.toString();
    const suffix = qs ? `?${qs}` : '';
    return this.fetch<ServiceTypeInstanceList>(
      `service-type-instances${suffix}`,
    );
  }
}
