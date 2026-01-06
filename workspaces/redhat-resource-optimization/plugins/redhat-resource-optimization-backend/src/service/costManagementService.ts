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

import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { CostManagementSlimApi } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import { CostManagementSlimClient } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import { DEFAULT_COST_MANAGEMENT_PROXY_BASE_URL } from '../util/constant';

export const costManagementServiceRef = createServiceRef<CostManagementSlimApi>(
  {
    id: 'cost-management-client',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {
          configApi: coreServices.rootConfig,
        },
        async factory({ configApi }): Promise<CostManagementSlimApi> {
          // Note: The client appends /cost-management/v1/... to this base URL
          const baseUrl =
            configApi.getOptionalString('costManagementProxyBaseUrl') ??
            DEFAULT_COST_MANAGEMENT_PROXY_BASE_URL;

          return new CostManagementSlimClient({
            discoveryApi: {
              async getBaseUrl(_pluginId?: string) {
                return baseUrl;
              },
            },
          }) as CostManagementSlimApi;
        },
      }),
  },
);
