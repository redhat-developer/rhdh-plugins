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

import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import request from 'supertest';
import type { NpxConnectorTestConfig } from './testUtils';
import { startConnector } from './testUtils';
import { npxSkillConnectorPlugin } from './plugin';
import { discoverIndex } from './services/discoverIndex';
import { processArtifacts } from './services/processArtifacts';

jest.mock('./services/discoverIndex', () => ({
  discoverIndex: jest.fn(),
}));

jest.mock('./services/processArtifacts', () => ({
  processArtifacts: jest.fn(),
}));

const mockedDiscoverIndex = jest.mocked(discoverIndex);
const mockedProcessArtifacts = jest.mocked(processArtifacts);

const logger = mockServices.logger.mock();

beforeEach(() => {
  jest.resetAllMocks();
  logger.child.mockReturnValue(logger);
});

const defaultSource: NpxConnectorTestConfig = {
  sources: [
    {
      id: 'rhess',
      indexUrl: 'https://skills.example.com/index.json',
      schedule: {
        frequency: { minutes: 10 },
        timeout: { minutes: 10 },
        initialDelay: { seconds: 0 },
      },
    },
  ],
};

describe('backend authentication', () => {
  it('rejects unauthenticated requests to GET /skills/:sourceId', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    mockedProcessArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server).get(
      '/api/npx-skill-connector/skills/rhess',
    );

    expect(response.status).toBe(401);
  });

  it('accepts service credentials for GET /skills/:sourceId', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    mockedProcessArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(200);
  });

  it('accepts user credentials for GET /skills/:sourceId', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    mockedProcessArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.user.header());

    expect(response.status).toBe(200);
  });
});

describe('unknown source handling', () => {
  it('returns 404 for an unknown source ID', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    mockedProcessArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/nonexistent')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Unknown source: nonexistent' });
  });
});

describe('snapshot lifecycle', () => {
  it('returns loading before the first refresh completes', async () => {
    // Use a scheduler that does NOT run initial tasks on startup
    const lazyScheduler = mockServices.scheduler.factory();

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
      lazyScheduler,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'loading',
      skills: [],
      failedSkillKeys: [],
      observedAt: null,
    });
  });

  it('returns ready with normalized records after refresh', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [
        {
          name: 'my-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/my/SKILL.md',
          digest: 'sha256:abc123',
        },
      ],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });

    mockedProcessArtifacts.mockResolvedValue({
      records: [
        {
          key: 'my-skill',
          name: 'My Skill',
          sourceUri: 'https://skills.example.com/my/SKILL.md',
          digest: 'sha256:abc123',
          extensions: { npx: { type: 'skill-md' } },
        },
      ],
      failedKeys: [],
    });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.skills).toHaveLength(1);
    expect(response.body.skills[0].key).toBe('my-skill');
    expect(response.body.failedSkillKeys).toEqual([]);
    expect(response.body.observedAt).toBeTruthy();
  });

  it('returns ready with empty skills for a successful empty index', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    mockedProcessArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ready',
      skills: [],
      failedSkillKeys: [],
    });
    expect(response.body.observedAt).toBeTruthy();
  });
});

describe('atomic publication', () => {
  it('publishes a failed snapshot when discovery returns no usable page', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: false,
      complete: false,
    });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('failed');
    expect(response.body.skills).toEqual([]);
    expect(response.body.observedAt).toBeTruthy();
  });

  it('publishes a partial snapshot with failed keys', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [
        {
          name: 'good-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/good/SKILL.md',
          digest: 'sha256:abc123',
        },
      ],
      failedKeys: ['discovery-fail'],
      hasUsablePage: true,
      complete: false,
    });

    mockedProcessArtifacts.mockResolvedValue({
      records: [
        {
          key: 'good-skill',
          name: 'Good Skill',
          sourceUri: 'https://skills.example.com/good/SKILL.md',
          digest: 'sha256:abc123',
          extensions: { npx: { type: 'skill-md' } },
        },
      ],
      failedKeys: ['artifact-fail'],
    });

    const { server } = await startConnector(
      defaultSource,
      logger,
      npxSkillConnectorPlugin,
    );

    const response = await request(server)
      .get('/api/npx-skill-connector/skills/rhess')
      .set('Authorization', mockCredentials.service.header());

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.skills).toHaveLength(1);
    expect(response.body.failedSkillKeys).toEqual(
      expect.arrayContaining(['discovery-fail', 'artifact-fail']),
    );
  });
});

describe('source isolation', () => {
  it('isolates failures between independent sources', async () => {
    const multiSource: NpxConnectorTestConfig = {
      sources: [
        {
          id: 'source-a',
          indexUrl: 'https://a.example.com/index.json',
          schedule: {
            frequency: { minutes: 10 },
            timeout: { minutes: 10 },
            initialDelay: { seconds: 0 },
          },
        },
        {
          id: 'source-b',
          indexUrl: 'https://b.example.com/index.json',
          schedule: {
            frequency: { minutes: 10 },
            timeout: { minutes: 10 },
            initialDelay: { seconds: 0 },
          },
        },
      ],
    };

    // source-a succeeds, source-b fails
    mockedDiscoverIndex.mockImplementation(async (source: { id: string }) => {
      if (source.id === 'source-a') {
        return {
          entries: [
            {
              name: 'skill-a',
              type: 'skill-md',
              url: 'https://a.example.com/skill/SKILL.md',
              digest: 'sha256:aaa',
            },
          ],
          failedKeys: [],
          hasUsablePage: true,
          complete: true,
        };
      }
      // source-b: total discovery failure
      return {
        entries: [],
        failedKeys: [],
        hasUsablePage: false,
        complete: false,
      };
    });

    mockedProcessArtifacts.mockImplementation(
      async (_entries: Array<{ name: string }>, source: { id: string }) => {
        if (source.id === 'source-a') {
          return {
            records: [
              {
                key: 'skill-a',
                name: 'Skill A',
                sourceUri: 'https://a.example.com/skill/SKILL.md',
                digest: 'sha256:aaa',
                extensions: { npx: { type: 'skill-md' } },
              },
            ],
            failedKeys: [],
          };
        }
        return { records: [], failedKeys: [] };
      },
    );

    const { server } = await startConnector(
      multiSource,
      logger,
      npxSkillConnectorPlugin,
    );

    // source-a should be ready with records
    const responseA = await request(server)
      .get('/api/npx-skill-connector/skills/source-a')
      .set('Authorization', mockCredentials.service.header());

    expect(responseA.status).toBe(200);
    expect(responseA.body.status).toBe('ready');
    expect(responseA.body.skills).toHaveLength(1);
    expect(responseA.body.skills[0].key).toBe('skill-a');

    // source-b should be failed, independent of source-a
    const responseB = await request(server)
      .get('/api/npx-skill-connector/skills/source-b')
      .set('Authorization', mockCredentials.service.header());

    expect(responseB.status).toBe(200);
    expect(responseB.body.status).toBe('failed');
    expect(responseB.body.skills).toEqual([]);
  });
});

describe('scheduled refresh', () => {
  it('registers scheduler tasks for each configured source', async () => {
    mockedDiscoverIndex.mockResolvedValue({
      entries: [],
      failedKeys: [],
      hasUsablePage: true,
      complete: true,
    });
    mockedProcessArtifacts.mockResolvedValue({ records: [], failedKeys: [] });

    await startConnector(
      {
        sources: [
          {
            id: 'scheduled-source',
            indexUrl: 'https://skills.example.com/index.json',
            schedule: {
              frequency: { minutes: 5 },
              timeout: { minutes: 5 },
              initialDelay: { seconds: 0 },
            },
          },
        ],
      },
      logger,
      npxSkillConnectorPlugin,
    );

    // The scheduler was invoked, which calls discoverIndex for the configured source
    expect(mockedDiscoverIndex).toHaveBeenCalledTimes(1);
    expect(mockedDiscoverIndex).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'scheduled-source' }),
      expect.anything(),
      expect.anything(),
    );
  });
});
