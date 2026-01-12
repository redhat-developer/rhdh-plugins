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
import { OptimizationsClient } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import { DEFAULT_API_BASE_URL } from '../util/constant';

export const optimizationServiceRef = createServiceRef<OptimizationsApi>({
  id: 'optimization-client',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        configApi: coreServices.rootConfig,
      },
      async factory({ configApi }): Promise<OptimizationsApi> {
        const baseUrl =
          configApi.getOptionalString('optimizationsBaseUrl') ??
          DEFAULT_API_BASE_URL;

        return new OptimizationsClient({
          discoveryApi: {
            async getBaseUrl(_pluginId?: string) {
              return baseUrl;
            },
          },
        }) as OptimizationsApi;
      },
    }),
});
