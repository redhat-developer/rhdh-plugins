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

import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import type { AddressInfo } from 'node:net';

import { boostPlugin } from './plugin';

describe('boostPlugin integration', () => {
  it('boots the plugin and serves unauthenticated GET /api/boost/health', async () => {
    const backend = await startTestBackend({
      features: [
        boostPlugin,
        catalogServiceMock.factory({ entities: [] }),
        mockServices.rootConfig.factory({
          data: {
            boost: {
              security: {
                mode: 'development-only-no-auth',
              },
            },
          },
        }),
      ],
    });

    try {
      const address = backend.server.address() as AddressInfo | string | null;
      const port =
        address && typeof address === 'object' ? address.port : undefined;
      expect(port).toBeDefined();

      const response = await fetch(`http://127.0.0.1:${port}/api/boost/health`);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    } finally {
      await backend.stop();
    }
  }, 60_000);
});
