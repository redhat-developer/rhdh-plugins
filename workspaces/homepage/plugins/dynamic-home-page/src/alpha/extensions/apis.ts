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
  ApiBlueprint,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/frontend-plugin-api';
import {
  DefaultCardsApiClient,
  defaultCardsApiRef,
  QuickAccessApiClient,
  quickAccessApiRef,
} from '../../api';

/**
 * Quick access API for the New Frontend System.
 * Provides access to quick access links from app config.
 *
 * @alpha
 */
const quickAccessApi = ApiBlueprint.make({
  name: 'quickaccess',
  disabled: false,
  params: defineParams =>
    defineParams({
      api: quickAccessApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, configApi, identityApi }) =>
        new QuickAccessApiClient({ discoveryApi, configApi, identityApi }),
    }),
});

/**
 * Default cards API for the New Frontend System.
 * Provides access to permission-filtered homepage cards from the backend.
 *
 * @alpha
 */
const defaultCardsApi = ApiBlueprint.make({
  name: 'default-cards',
  disabled: false,
  params: defineParams =>
    defineParams({
      api: defaultCardsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new DefaultCardsApiClient({ discoveryApi, fetchApi }),
    }),
});

export { defaultCardsApi, quickAccessApi };
