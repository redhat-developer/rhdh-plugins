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
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  scorecardCollectorsServiceFactory,
  scorecardPlugin,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import { scorecardModuleCatalog } from './module';

type ListeningServer = {
  port: () => number;
  close: () => void;
};

type JsonBody = {
  metrics?: { id: string; title?: string; type?: string }[];
};

const titleMetricConfig = {
  scorecard: {
    metricProviders: {
      catalog: {
        requiredAttributes: {
          options: {
            filter: { kind: 'Component' },
            metrics: {
              title: {
                title: 'Has title',
                description: 'Entity metadata.title is set',
                field: 'metadata.title',
              },
            },
          },
        },
      },
    },
  },
};

async function getJson(
  server: ListeningServer,
  path: string,
): Promise<{ status: number; body: JsonBody }> {
  const response = await fetch(`http://127.0.0.1:${server.port()}${path}`);
  return { status: response.status, body: (await response.json()) as JsonBody };
}

async function startCatalogBackend(configured: boolean) {
  const started = await startTestBackend({
    features: [
      scorecardCollectorsServiceFactory,
      scorecardPlugin,
      scorecardModuleCatalog,
      mockServices.rootConfig.factory({
        data: {
          backend: {
            database: { client: 'better-sqlite3', connection: ':memory:' },
          },
          ...(configured ? titleMetricConfig : {}),
        },
      }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
      catalogServiceMock.factory({ entities: [] }),
    ],
  });

  return {
    server: started.server,
    stop: () => started.stop(),
  };
}

describe('scorecard catalog module', () => {
  let server: ListeningServer;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    ({ server, stop } = await startCatalogBackend(true));
  }, 60_000);

  afterAll(async () => {
    server.close();
    await stop();
  });

  it('registers catalog.title when a metric is configured', async () => {
    const response = await getJson(server, '/api/scorecard/metrics');

    expect(response.status).toBe(200);
    expect(response.body.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'catalog.title',
          title: 'Has title',
          type: 'number',
        }),
      ]),
    );
  });

  it('registers no catalog metrics when the catalog block is absent', async () => {
    const started = await startCatalogBackend(false);

    try {
      const response = await getJson(started.server, '/api/scorecard/metrics');

      expect(response.status).toBe(200);
      expect(
        response.body.metrics?.some(metric => metric.id.startsWith('catalog.')),
      ).toBe(false);
    } finally {
      started.server.close();
      await started.stop();
    }
  }, 60_000);
});
