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
import { scorecardModuleDependabot } from './module';

type ListeningServer = {
  port: () => number;
  close: () => void;
};

type JsonBody = {
  metrics?: { id: string; type?: string }[];
};

const DEPENDABOT_METRIC_IDS = [
  'dependabot.alertsCritical',
  'dependabot.alertsHigh',
  'dependabot.alertsMedium',
  'dependabot.alertsLow',
];

async function getJson(
  server: ListeningServer,
  path: string,
): Promise<{ status: number; body: JsonBody }> {
  const response = await fetch(`http://127.0.0.1:${server.port()}${path}`);
  return { status: response.status, body: (await response.json()) as JsonBody };
}

describe('scorecard dependabot module', () => {
  let server: ListeningServer;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    const started = await startTestBackend({
      features: [
        scorecardCollectorsServiceFactory,
        scorecardPlugin,
        scorecardModuleDependabot,
        mockServices.rootConfig.factory({
          data: {
            backend: {
              database: { client: 'better-sqlite3', connection: ':memory:' },
            },
          },
        }),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user('user:default/test'),
        }),
        catalogServiceMock.factory({ entities: [] }),
      ],
    });
    server = started.server;
    stop = () => started.stop();
  }, 60_000);

  afterAll(async () => {
    server.close();
    await stop();
  });

  it('registers the four Dependabot alert metrics without a GitHub integration', async () => {
    const response = await getJson(server, '/api/scorecard/metrics');

    expect(response.status).toBe(200);
    expect(response.body.metrics?.map(metric => metric.id)).toEqual(
      DEPENDABOT_METRIC_IDS,
    );
    expect(
      response.body.metrics?.every(metric => metric.type === 'number'),
    ).toBe(true);
  });
});
