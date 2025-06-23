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
import type { OptimizationsApi } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import { DefaultApiClient } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/DefaultApiClient';

const DEFAULT_OPTIMIZATIONS_BASE_URL =
  'https://console.redhat.com/api/cost-management/v1';

export const optimizationServiceRef = createServiceRef<OptimizationsApi>({
  id: 'optimization-client',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        configApi: coreServices.rootConfig,
      },
      async factory({ configApi }) {
        // create a custom object to override the base URL
        const defaultClient = new DefaultApiClient({
          discoveryApi: {
            async getBaseUrl() {
              const baseUrl =
                configApi.getOptionalString('optimizationsBaseUrl') ??
                DEFAULT_OPTIMIZATIONS_BASE_URL;
              return baseUrl;
            },
          },
        });
        return defaultClient;
      },
    }),
});
