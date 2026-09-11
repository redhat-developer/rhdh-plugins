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

import path from 'path';
import request from 'supertest';
import { ExtendedHttpServer } from '@backstage/backend-defaults/rootHttpRouter';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import catalogPlugin from '@backstage/plugin-catalog-backend';
import catalogModuleAiModel from '@backstage/plugin-catalog-backend-module-ai-model';
import authPlugin from '@backstage/plugin-auth-backend';
import authModuleGuestProvider from '@backstage/plugin-auth-backend-module-guest-provider';
import { Entity } from '@backstage/catalog-model';
import { catalogModuleCatalogBackendModuleAiResourceExtensions } from './module';

const FIXTURE_PATH = path.join(
  __dirname,
  '__fixtures__',
  'catalog-ai-resources.yaml',
);

const BASE_CONFIG = {
  app: { baseUrl: 'http://localhost:3000' },
  backend: {
    baseUrl: 'http://localhost:7007',
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
  },
  auth: {
    providers: {
      guest: {},
    },
  },
  permission: {
    enabled: false,
  },
  catalog: {
    processingInterval: { seconds: 1 },
    rules: [{ allow: ['AiResource', 'Location'] }],
    locations: [
      {
        type: 'file',
        target: FIXTURE_PATH,
      },
    ],
  },
};

async function waitForEntities(
  server: ExtendedHttpServer,
  filter: string,
  minCount: number,
  timeoutMs = 90_000,
): Promise<Entity[]> {
  const start = Date.now();
  let lastStatus = 0;
  let lastBody: unknown;

  while (Date.now() - start < timeoutMs) {
    const response = await request(server).get(
      `/api/catalog/entities?filter=${encodeURIComponent(filter)}`,
    );

    lastStatus = response.status;
    lastBody = response.body;

    if (response.status === 200 && Array.isArray(response.body)) {
      if (response.body.length >= minCount) {
        return response.body as Entity[];
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Timed out waiting for at least ${minCount} entities with filter "${filter}" (last status ${lastStatus}, body ${JSON.stringify(
      lastBody,
    )})`,
  );
}

function aiResourcesOnly(entities: Entity[]): Entity[] {
  return entities.filter(
    entity => entity.kind.toLocaleLowerCase('en-US') === 'airesource',
  );
}

describe('AiResource catalog discovery integration (RHIDP-14382 / RHIDP-14746)', () => {
  jest.setTimeout(120_000);

  let server: ExtendedHttpServer;

  beforeAll(async () => {
    const backend = await startTestBackend({
      features: [
        catalogPlugin,
        catalogModuleCatalogBackendModuleAiResourceExtensions,
        catalogModuleAiModel,
        authPlugin,
        authModuleGuestProvider,
        mockServices.rootConfig.factory({ data: BASE_CONFIG }),
        mockServices.rootLogger.factory(),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory({
          defaultCredentials: mockCredentials.user('user:default/guest'),
        }),
      ],
    });
    server = backend.server;

    await request(server)
      .post('/api/catalog/locations')
      .send({ type: 'file', target: FIXTURE_PATH });

    await waitForEntities(server, 'kind=airesource', 3);
  }, 120_000);

  it('ingests git and OCI AiResource entities from file location', async () => {
    const entities = aiResourcesOnly(
      await waitForEntities(server, 'kind=airesource', 3),
    );

    const names = entities.map(entity => entity.metadata.name).sort();
    expect(names).toEqual([
      'qe-git-ai-standards',
      'qe-oci-skills-bundle',
      'qe-oci-with-docs',
    ]);
  });

  it('returns AiResource entities via kind filter', async () => {
    const entities = aiResourcesOnly(
      await waitForEntities(server, 'kind=airesource', 3),
    );

    expect(
      entities.every(
        entity => entity.kind.toLocaleLowerCase('en-US') === 'airesource',
      ),
    ).toBe(true);
  });

  it('filters AiResource entities by spec.scope', async () => {
    const entities = await waitForEntities(
      server,
      'kind=airesource,spec.scope=team',
      1,
    );

    expect(entities).toHaveLength(1);
    expect(entities[0].metadata.name).toBe('qe-oci-skills-bundle');
    expect(entities[0].spec?.scope).toBe('team');
  });

  it('filters AiResource entities by spec.type', async () => {
    const entities = aiResourcesOnly(
      await waitForEntities(server, 'kind=airesource,spec.type=skill', 3),
    );

    expect(entities.every(entity => entity.spec?.type === 'skill')).toBe(true);
  });

  it('filters AiResource entities by spec.owner', async () => {
    const entities = aiResourcesOnly(
      await waitForEntities(
        server,
        'kind=airesource,spec.owner=team-ml-platform',
        3,
      ),
    );

    expect(entities).toHaveLength(3);
    expect(
      entities.every(entity => entity.spec?.owner === 'team-ml-platform'),
    ).toBe(true);
  });

  it('filters AiResource entities by spec.lifecycle', async () => {
    const entities = aiResourcesOnly(
      await waitForEntities(
        server,
        'kind=airesource,spec.lifecycle=production',
        2,
      ),
    );

    const names = entities.map(entity => entity.metadata.name).sort();
    expect(names).toEqual(['qe-git-ai-standards', 'qe-oci-with-docs']);
  });

  it('retrieves a single AiResource entity by name', async () => {
    const response = await request(server).get(
      '/api/catalog/entities/by-name/airesource/default/qe-git-ai-standards',
    );

    expect(response.status).toBe(200);
    expect(response.body.metadata.name).toBe('qe-git-ai-standards');
    expect(
      response.body.metadata.annotations?.['backstage.io/source-location'],
    ).toBe('url:https://github.com/my-org/qe-git-ai-standards');
  });

  it('stores OCI source-location as metadata reference only', async () => {
    const response = await request(server).get(
      '/api/catalog/entities/by-name/airesource/default/qe-oci-skills-bundle',
    );

    expect(response.status).toBe(200);
    expect(
      response.body.metadata.annotations?.['backstage.io/source-location'],
    ).toBe('url:oci://quay.io/my-org/qe-skills-bundle:v1.0.0');
  });

  it('excludes entities without spec.scope when scope filter is applied', async () => {
    const scopedEntities = await waitForEntities(
      server,
      'kind=airesource,spec.scope=organization',
      1,
    );

    expect(scopedEntities).toHaveLength(1);
    expect(scopedEntities[0].metadata.name).toBe('qe-git-ai-standards');
  });

  it('persists metadata tags and spec fields on ingested entities', async () => {
    const response = await request(server).get(
      '/api/catalog/entities/by-name/airesource/default/qe-oci-skills-bundle',
    );

    expect(response.status).toBe(200);
    expect(response.body.metadata.tags).toEqual(['security', 'oci']);
    expect(response.body.spec).toMatchObject({
      type: 'skill',
      lifecycle: 'experimental',
      owner: 'team-ml-platform',
      scope: 'team',
    });
  });

  it('stores techdocs-ref annotation when declared', async () => {
    const response = await request(server).get(
      '/api/catalog/entities/by-name/airesource/default/qe-oci-with-docs',
    );

    expect(response.status).toBe(200);
    expect(
      response.body.metadata.annotations?.['backstage.io/techdocs-ref'],
    ).toBe('dir:.');
  });
});
