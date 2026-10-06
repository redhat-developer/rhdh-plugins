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
  TestDatabases,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { adoptionInsightsPlugin } from './plugin';
import request from 'supertest';

// TEMPLATE NOTE:
// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  // eslint-disable-next-line jest/expect-expect
  it('should throw Bad request when query params are not passed', async () => {
    const { server } = await startTestBackend({
      features: [adoptionInsightsPlugin],
    });

    await request(server)
      .get(`/api/adoption-insights/events?timezone=${timezone}`)
      .expect(400, {
        message: 'Invalid query',
        errors: {
          start_date: [
            'start_date is required. Use YYYY-MM-DD (e.g., 2025-03-02)',
          ],
          end_date: ['end_date is required. Use YYYY-MM-DD (e.g., 2025-03-02)'],
          type: [
            'Invalid type. Allowed values: total_users,active_users,top_plugins,top_templates,top_techdocs,top_searches,top_catalog_entities',
          ],
        },
      });
  });

  // eslint-disable-next-line jest/expect-expect
  it('should return the data for valid query', async () => {
    const BASE_CONFIG = {
      app: {
        baseUrl: 'https://my-backstage-app.example.com',
      },
      backend: {
        baseUrl: 'http://localhost:7007',
        database: {
          client: 'better-sqlite3',
          connection: ':memory:',
        },
      },
    };
    const { server } = await startTestBackend({
      features: [
        adoptionInsightsPlugin,
        mockServices.rootConfig.factory({
          data: { ...BASE_CONFIG },
        }),
      ],
    });
    await request(server)
      .get(
        `/api/adoption-insights/events?type=active_users&start_date=1990-03-02&end_date=1990-03-04&timezone=${timezone}`,
      )
      .expect(200, { grouping: 'daily', data: [] });
  });
});

// L2 integration coverage for the `GET /events` analytics contract.
//
// The `plugin` tests above only exercise `active_users` against an empty
// database, so none of the per-`type` SQL aggregation built in the database
// adapters is actually executed. Here we seed a real SQLite database (the same
// adapter the plugin selects for `better-sqlite3`) and assert the aggregated
// HTTP response for every `type`. These assertions would catch a regression in
// the adapter SQL that a mocked-knex unit test cannot.

const START = '2025-06-02';
const END = '2025-06-08'; // 6-day window -> `daily` grouping
const TZ = 'UTC';

const baseQuery = (type: string, extra = '') =>
  `/api/adoption-insights/events?type=${type}&start_date=${START}&end_date=${END}&timezone=${TZ}${extra}`;

// Builds a DB-ready `events` row. attributes/context are stored as JSON strings,
// matching how the SqliteAdapter persists them, so rows can be inserted as-is.
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

type Entity = { kind: string; name: string; namespace: string };
const COMPONENT: Entity = {
  kind: 'Component',
  name: 'my-service',
  namespace: 'default',
};
const API: Entity = { kind: 'API', name: 'my-api', namespace: 'default' };

const view = (plugin_id: string, user: string, entity: Entity, at: string) =>
  event({
    action: 'navigate',
    subject: plugin_id,
    plugin_id,
    user,
    at,
    attributes: entity,
  });

// Users and their first-ever event (used by active_users new/returning logic):
//   alice -> 2025-06-03, bob -> 2025-06-03, carol -> 2025-06-05
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

describe('adoptionInsightsPlugin seeded analytics', () => {
  const databases = TestDatabases.create({ ids: ['SQLITE_3'] });
  let server: any;

  beforeAll(async () => {
    // A real SQLite database shared with the plugin via the mock database
    // service, so the plugin runs its own migrations and real adapter SQL
    // against the rows we seed.
    const knex = await databases.init('SQLITE_3');
    ({ server } = await startTestBackend({
      features: [
        adoptionInsightsPlugin,
        mockServices.database.factory({ knex }),
        mockServices.rootConfig.factory({
          data: {
            app: {
              analytics: {
                adoptionInsights: {
                  // Keep the batch processor from flushing during the test.
                  flushInterval: 600000,
                  licensedUsers: 100,
                },
              },
            },
            backend: { baseUrl: 'http://localhost:7007' },
          },
        }),
        // Force the TechDocs metadata lookup onto its hermetic fallback path
        // (site_name = entity name) instead of making real HTTP requests.
        mockServices.discovery.mock({
          getBaseUrl: async () => {
            throw new Error('no techdocs backend in test');
          },
        }).factory,
      ],
    }));

    await knex('events').insert(SEED);
  });

  it('total_users counts distinct users in range alongside the licensed count', async () => {
    const res = await request(server).get(baseQuery('total_users'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [{ logged_in_users: 3, licensed_users: 100 }],
    });
  });

  it('active_users groups daily totals into new vs returning users', async () => {
    const res = await request(server).get(baseQuery('active_users'));

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

  it('top_searches counts search events per day', async () => {
    const res = await request(server).get(baseQuery('top_searches'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grouping: 'daily',
      data: [
        { date: '2025-06-03', count: 2 },
        { date: '2025-06-05', count: 1 },
      ],
    });
  });

  it('top_templates ranks scaffolder creations by entity ref with last-used time', async () => {
    const res = await request(server).get(baseQuery('top_templates'));

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

  it('top_techdocs aggregates techdocs views and falls back to the entity name', async () => {
    const res = await request(server).get(baseQuery('top_techdocs'));

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

  it('top_catalog_entities ranks catalog navigations by entity', async () => {
    const res = await request(server).get(baseQuery('top_catalog_entities'));

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

  it('top_catalog_entities honours the kind filter', async () => {
    const res = await request(server).get(
      baseQuery('top_catalog_entities', '&kind=api'),
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

  it('top_plugins ranks plugin visits with a per-day trend', async () => {
    const res = await request(server).get(baseQuery('top_plugins'));

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
      baseQuery('top_templates', '&limit=1'),
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

  it('serves the result as CSV when format=csv', async () => {
    const res = await request(server).get(
      baseQuery('top_searches', '&format=csv'),
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(
      'adoption_insights_top_searches.csv',
    );
    expect(res.text).toBe('date,count\n2025-06-03,2\n2025-06-05,1');
  });
});

// The date-grouping strategy is derived from the requested range (same day ->
// hourly, up to a week -> daily, up to a month -> weekly, longer -> monthly).
// Each branch produces different bucketing SQL in the adapter, so we drive each
// one with a range and assert the resulting buckets.
describe('adoptionInsightsPlugin date grouping', () => {
  const databases = TestDatabases.create({ ids: ['SQLITE_3'] });
  let server: any;

  beforeAll(async () => {
    const knex = await databases.init('SQLITE_3');
    ({ server } = await startTestBackend({
      features: [
        adoptionInsightsPlugin,
        mockServices.database.factory({ knex }),
        mockServices.rootConfig.factory({
          data: { backend: { baseUrl: 'http://localhost:7007' } },
        }),
      ],
    }));

    await knex('events').insert([
      search('alice', '2025-06-03T10:00:00.000Z'),
      search('alice', '2025-06-03T11:30:00.000Z'),
      search('alice', '2025-06-10T10:00:00.000Z'),
      search('alice', '2025-07-15T10:00:00.000Z'),
    ]);
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

  it('buckets by day while labelling the grouping monthly for a multi-month range', async () => {
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
