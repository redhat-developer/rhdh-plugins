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
  TestDatabases,
} from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { AnalyticsEvent } from '@backstage/core-plugin-api';
import { adoptionInsightsPlugin } from './plugin';
import { QUERY_TYPES } from './types/event-request';
import request from 'supertest';
import type { Server } from 'http';
import type { Knex } from 'knex';

const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

const BASE_CONFIG = {
  app: {
    baseUrl: 'https://my-backstage-app.example.com',
    analytics: {
      adoptionInsights: {
        flushInterval: 600000,
        licensedUsers: 100,
      },
    },
  },
  backend: {
    baseUrl: 'http://localhost:7007',
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
  },
};

const mockEvent: AnalyticsEvent = {
  action: 'test-action',
  subject: 'test-subject',
  value: 42,
  context: {
    routeRef: 'test-route',
    pluginId: 'test-plugin',
    extension: 'routeRef',
    userName: 'test-user',
    userId: 'user:default/test-user',
    timestamp: '2025-03-02T16:25:32.819Z',
  },
  attributes: { key: 'value' },
};

function eventsUrl(params: Record<string, string> = {}) {
  const search = new URLSearchParams({
    type: 'active_users',
    start_date: '1990-03-02',
    end_date: '1990-03-04',
    timezone,
    ...params,
  });
  return `/api/adoption-insights/events?${search.toString()}`;
}

function startAdoptionInsightsBackend(options?: {
  authorizeResult?: AuthorizeResult.ALLOW | AuthorizeResult.DENY;
  knex?: Knex;
  discovery?: ReturnType<typeof mockServices.discovery.mock>['factory'];
}) {
  const authorizeResult = options?.authorizeResult ?? AuthorizeResult.ALLOW;

  return startTestBackend({
    features: [
      adoptionInsightsPlugin,
      mockServices.rootConfig.factory({ data: BASE_CONFIG }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
      mockServices.permissions.mock({
        authorize: async requests =>
          requests.map(() => ({ result: authorizeResult })),
      }).factory,
      ...(options?.knex
        ? [mockServices.database.factory({ knex: options.knex })]
        : []),
      ...(options?.discovery ? [options.discovery] : []),
    ],
  });
}

describe('adoption-insights plugin (startTestBackend)', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startAdoptionInsightsBackend());
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/adoption-insights/health', () => {
    it('returns ok', async () => {
      const res = await request(server).get('/api/adoption-insights/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('returns 401 when request has no user credentials', async () => {
      const res = await request(server)
        .get('/api/adoption-insights/health')
        .set('Authorization', mockCredentials.none.header());

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/adoption-insights/events', () => {
    it('returns 400 when query params are missing', async () => {
      const res = await request(server).get(
        `/api/adoption-insights/events?timezone=${timezone}`,
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: 'Invalid query',
        errors: {
          start_date: [
            'start_date is required. Use YYYY-MM-DD (e.g., 2025-03-02)',
          ],
          end_date: ['end_date is required. Use YYYY-MM-DD (e.g., 2025-03-02)'],
          type: [`Invalid type. Allowed values: ${QUERY_TYPES}`],
        },
      });
    });

    it('returns 400 for an invalid event type', async () => {
      const res = await request(server).get(
        eventsUrl({ type: 'not_a_real_type' }),
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid query');
      expect(res.body.errors.type).toEqual([
        `Invalid type. Allowed values: ${QUERY_TYPES}`,
      ]);
    });

    it('returns 400 for invalid date formats', async () => {
      const res = await request(server).get(
        eventsUrl({ start_date: '03-02-1990', end_date: 'not-a-date' }),
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid query');
      expect(res.body.errors.start_date).toEqual([
        'Invalid date format for start_date. Expected YYYY-MM-DD (e.g., 2025-03-02)',
      ]);
      expect(res.body.errors.end_date).toEqual([
        'Invalid date format for end_date. Expected YYYY-MM-DD (e.g., 2025-03-02)',
      ]);
    });

    it('returns 400 when start_date is after end_date', async () => {
      const res = await request(server).get(
        eventsUrl({ start_date: '1990-03-04', end_date: '1990-03-02' }),
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid query');
      expect(res.body.errors.end_date).toEqual([
        'start_date should not be greater than end_date',
      ]);
    });

    it('returns 400 for an invalid format', async () => {
      const res = await request(server).get(eventsUrl({ format: 'xml' }));

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid query');
      expect(res.body.errors.format).toEqual([
        'Invalid format. Allowed values: json, csv',
      ]);
    });

    it('returns 401 when request has no user credentials', async () => {
      const res = await request(server)
        .get(eventsUrl())
        .set('Authorization', mockCredentials.none.header());

      expect(res.status).toBe(401);
    });

    it('returns 403 for service credentials', async () => {
      const res = await request(server)
        .get(eventsUrl())
        .set('Authorization', mockCredentials.service.header());

      expect(res.status).toBe(403);
    });

    it('returns 403 when the user is not authorized', async () => {
      const backend = await startAdoptionInsightsBackend({
        authorizeResult: AuthorizeResult.DENY,
      });

      try {
        const res = await request(backend.server).get(eventsUrl());

        expect(res.status).toBe(403);
      } finally {
        backend.server.close();
      }
    });
  });

  describe('POST /api/adoption-insights/events', () => {
    it('accepts a valid event payload', async () => {
      const res = await request(server)
        .post('/api/adoption-insights/events')
        .send([mockEvent]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Event received' });
    });

    it('ignores events without a user id', async () => {
      const res = await request(server)
        .post('/api/adoption-insights/events')
        .send([{ action: 'click' }]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Event received' });
    });

    it('returns 400 for invalid event data', async () => {
      const res = await request(server)
        .post('/api/adoption-insights/events')
        .send([
          {
            context: {
              ...mockEvent.context,
              pluginId: '',
            },
          },
        ]);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid event data');
      expect(res.body.errors.action).toEqual(['Action is required']);
    });

    it('returns 401 when request has no user credentials', async () => {
      const res = await request(server)
        .post('/api/adoption-insights/events')
        .set('Authorization', mockCredentials.none.header())
        .send([mockEvent]);

      expect(res.status).toBe(401);
    });

    it('returns 403 for service credentials', async () => {
      const res = await request(server)
        .post('/api/adoption-insights/events')
        .set('Authorization', mockCredentials.service.header())
        .send([mockEvent]);

      expect(res.status).toBe(403);
    });
  });
});

const START = '2025-06-02';
const END = '2025-06-08';
const TZ = 'UTC';

const seededEventsUrl = (type: string, extra = '') =>
  `/api/adoption-insights/events?type=${type}&start_date=${START}&end_date=${END}&timezone=${TZ}${extra}`;

const event = (fields: {
  action: string;
  subject: string;
  plugin_id: string;
  user: string;
  at: string;
  attributes?: Record<string, unknown>;
  context?: Record<string, unknown>;
}) => ({
  action: fields.action,
  subject: fields.subject,
  plugin_id: fields.plugin_id,
  user_ref: `user:default/${fields.user}`,
  attributes: JSON.stringify(fields.attributes ?? {}),
  context: JSON.stringify(fields.context ?? {}),
  value: null,
  created_at: fields.at,
});

const search = (user: string, at: string) =>
  event({ action: 'search', subject: 'search', plugin_id: 'search', user, at });

const templateCreate = (user: string, entityRef: string, at: string) =>
  event({
    action: 'click',
    subject: 'Create',
    plugin_id: 'scaffolder',
    user,
    at,
    context: { entityRef },
  });

type CatalogEntity = { kind: string; name: string; namespace: string };
const COMPONENT: CatalogEntity = {
  kind: 'Component',
  name: 'my-service',
  namespace: 'default',
};
const API: CatalogEntity = {
  kind: 'API',
  name: 'my-api',
  namespace: 'default',
};

const view = (
  plugin_id: string,
  user: string,
  entity: CatalogEntity,
  at: string,
) =>
  event({
    action: 'navigate',
    subject: plugin_id,
    plugin_id,
    user,
    at,
    attributes: entity,
  });

const SEED = [
  search('alice', '2025-06-03T10:00:00.000Z'),
  search('bob', '2025-06-03T11:00:00.000Z'),
  search('alice', '2025-06-05T09:00:00.000Z'),
  templateCreate(
    'alice',
    'template:default/nodejs',
    '2025-06-03T10:00:00.000Z',
  ),
  templateCreate('bob', 'template:default/nodejs', '2025-06-04T10:00:00.000Z'),
  templateCreate(
    'alice',
    'template:default/python',
    '2025-06-05T10:00:00.000Z',
  ),
  view('techdocs', 'alice', COMPONENT, '2025-06-03T10:00:00.000Z'),
  view('techdocs', 'bob', COMPONENT, '2025-06-04T10:00:00.000Z'),
  view('catalog', 'alice', COMPONENT, '2025-06-03T10:00:00.000Z'),
  view('catalog', 'bob', API, '2025-06-04T10:00:00.000Z'),
  view('catalog', 'carol', COMPONENT, '2025-06-05T10:00:00.000Z'),
];

describe('GET /api/adoption-insights/events with seeded data', () => {
  const databases = TestDatabases.create({ ids: ['SQLITE_3'] });
  let server: Server;

  beforeAll(async () => {
    const knex = await databases.init('SQLITE_3');
    ({ server } = await startAdoptionInsightsBackend({
      knex,
      discovery: mockServices.discovery.mock({
        getBaseUrl: async () => {
          throw new Error('no techdocs backend in test');
        },
      }).factory,
    }));
    await knex('events').insert(SEED);
  });

  afterAll(() => {
    server.close();
  });

  it('returns total_users with distinct users and licensed count', async () => {
    const res = await request(server).get(seededEventsUrl('total_users'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [{ logged_in_users: 3, licensed_users: 100 }],
    });
  });

  it('returns active_users grouped daily into new vs returning', async () => {
    const res = await request(server).get(seededEventsUrl('active_users'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'daily',
      data: [
        {
          date: '2025-06-03',
          total_users: 2,
          new_users: 2,
          returning_users: 0,
        },
        {
          date: '2025-06-04',
          total_users: 1,
          new_users: 0,
          returning_users: 1,
        },
        {
          date: '2025-06-05',
          total_users: 2,
          new_users: 1,
          returning_users: 1,
        },
      ],
    });
  });

  it('returns top_searches counted per day', async () => {
    const res = await request(server).get(seededEventsUrl('top_searches'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'daily',
      data: [
        { date: '2025-06-03', count: 2 },
        { date: '2025-06-05', count: 1 },
      ],
    });
  });

  it('returns top_templates ranked by scaffolder creations', async () => {
    const res = await request(server).get(seededEventsUrl('top_templates'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          entityref: 'template:default/nodejs',
          count: 2,
          last_used: '2025-06-04T10:00:00Z',
        },
        {
          entityref: 'template:default/python',
          count: 1,
          last_used: '2025-06-05T10:00:00Z',
        },
      ],
    });
  });

  it('returns top_techdocs views falling back to the entity name', async () => {
    const res = await request(server).get(seededEventsUrl('top_techdocs'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          count: 2,
          last_used: '2025-06-04T10:00:00Z',
          kind: 'component',
          name: 'my-service',
          namespace: 'default',
          site_name: 'my-service',
        },
      ],
    });
  });

  it('returns top_catalog_entities ranked by catalog navigations', async () => {
    const res = await request(server).get(
      seededEventsUrl('top_catalog_entities'),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          plugin_id: 'catalog',
          kind: 'component',
          name: 'my-service',
          namespace: 'default',
          last_used: '2025-06-05T10:00:00Z',
          count: 2,
        },
        {
          plugin_id: 'catalog',
          kind: 'api',
          name: 'my-api',
          namespace: 'default',
          last_used: '2025-06-04T10:00:00Z',
          count: 1,
        },
      ],
    });
  });

  it('honours the kind filter for top_catalog_entities', async () => {
    const res = await request(server).get(
      seededEventsUrl('top_catalog_entities', '&kind=api'),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          plugin_id: 'catalog',
          kind: 'api',
          name: 'my-api',
          namespace: 'default',
          last_used: '2025-06-04T10:00:00Z',
          count: 1,
        },
      ],
    });
  });

  it('returns top_plugins ranked with a per-day trend', async () => {
    const res = await request(server).get(seededEventsUrl('top_plugins'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'daily',
      data: [
        {
          plugin_id: 'catalog',
          visit_count: 3,
          trend: [
            { date: '2025-06-03', count: 1 },
            { date: '2025-06-04', count: 1 },
            { date: '2025-06-05', count: 1 },
          ],
          trend_percentage: 0,
        },
        {
          plugin_id: 'techdocs',
          visit_count: 2,
          trend: [
            { date: '2025-06-03', count: 1 },
            { date: '2025-06-04', count: 1 },
          ],
          trend_percentage: 0,
        },
      ],
    });
  });

  it('applies the limit query parameter', async () => {
    const res = await request(server).get(
      seededEventsUrl('top_templates', '&limit=1'),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          entityref: 'template:default/nodejs',
          count: 2,
          last_used: '2025-06-04T10:00:00Z',
        },
      ],
    });
  });

  it('serves CSV when format=csv', async () => {
    const res = await request(server).get(
      seededEventsUrl('top_searches', '&format=csv'),
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(
      'adoption_insights_top_searches.csv',
    );
    expect(res.text).toBe('date,count\n2025-06-03,2\n2025-06-05,1');
  });
});

describe('GET /api/adoption-insights/events date grouping', () => {
  const databases = TestDatabases.create({ ids: ['SQLITE_3'] });
  let server: Server;

  beforeAll(async () => {
    const knex = await databases.init('SQLITE_3');
    ({ server } = await startAdoptionInsightsBackend({ knex }));
    await knex('events').insert([
      search('alice', '2025-06-03T10:00:00.000Z'),
      search('alice', '2025-06-03T11:30:00.000Z'),
      search('alice', '2025-06-10T10:00:00.000Z'),
      search('alice', '2025-07-15T10:00:00.000Z'),
    ]);
  });

  afterAll(() => {
    server.close();
  });

  it('buckets by hour for a single-day range', async () => {
    const res = await request(server).get(
      '/api/adoption-insights/events?type=top_searches&start_date=2025-06-03&end_date=2025-06-03&timezone=UTC&limit=50',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'hourly',
      data: [
        { date: '2025-06-03 10:00:00', count: 1 },
        { date: '2025-06-03 11:00:00', count: 1 },
      ],
    });
  });

  it('buckets by week start for a multi-week range', async () => {
    const res = await request(server).get(
      '/api/adoption-insights/events?type=top_searches&start_date=2025-06-01&end_date=2025-06-20&timezone=UTC&limit=50',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'weekly',
      data: [
        { date: '2025-06-02', count: 2 },
        { date: '2025-06-09', count: 1 },
      ],
    });
  });

  it('labels grouping monthly for a multi-month range', async () => {
    const res = await request(server).get(
      '/api/adoption-insights/events?type=top_searches&start_date=2025-05-01&end_date=2025-07-31&timezone=UTC&limit=50',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'monthly',
      data: [
        { date: '2025-06-03', count: 2 },
        { date: '2025-06-10', count: 1 },
        { date: '2025-07-15', count: 1 },
      ],
    });
  });
});
