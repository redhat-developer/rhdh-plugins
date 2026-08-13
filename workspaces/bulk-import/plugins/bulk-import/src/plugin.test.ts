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

import type { IdentityApi } from '@backstage/core-plugin-api';
import { MockConfigApi } from '@backstage/test-utils';

import {
  bulkImportApiRef,
  BulkImportBackendClient,
} from './api/BulkImportBackendClient';
import { bulkImportPlugin } from './plugin';

describe('bulk-import', () => {
  it('registers bulkImportApiRef via the plugin API factory', () => {
    const [apiFactory] = bulkImportPlugin.getApis();
    expect(apiFactory.api).toBe(bulkImportApiRef);

    const configApi = new MockConfigApi({
      app: { baseUrl: 'http://localhost:3000' },
    });
    const identityApi = {
      getBackstageIdentity: jest.fn(),
      getProfileInfo: jest.fn(),
      getCredentials: jest.fn(),
      signOut: jest.fn(),
    } as unknown as IdentityApi;

    const api = apiFactory.factory({ configApi, identityApi });
    expect(api).toBeInstanceOf(BulkImportBackendClient);
  });
});
