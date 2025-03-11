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
import { Knex } from 'knex';
import { BaseDatabaseAdapter } from './BaseAdapter';
import { PostgresAdapter } from './PostgresAdapter';
import { AnalyticsEvent } from '@backstage/core-plugin-api';
import { Event } from '../../models/Event';
import { mockServices } from '@backstage/backend-test-utils';

describe('BaseAdapter', () => {
  let infoLog: jest.SpyInstance;
  let errorLog: jest.SpyInstance;
  const logger = mockServices.logger.mock();
  const mockKnex = {
    returning: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 1, name: 'Mocked' }),
    as: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereBetween: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnValue('mocked_raw_sql'),
    with: jest.fn().mockReturnThis(),
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    }),
  } as unknown as jest.Mocked<Knex>;

  const mockDb = jest.fn().mockReturnValue({
    ...mockKnex,
  }) as any;

  const setupDb = (db = mockDb) => {
    db.as = jest.fn().mockReturnThis();
    db.groupByRaw = jest.fn();
    db.toQuery = jest.fn();
    db.from = jest.fn().mockReturnThis();
    db.with = jest.fn().mockReturnThis();
    db.select = jest.fn().mockReturnThis();
    db.andWhere = jest.fn().mockReturnThis();
    db.whereBetween = jest.fn().mockReturnThis();
    db.leftJoin = jest.fn().mockReturnThis();
    db.groupBy = jest.fn().mockReturnThis();
    db.orderBy = jest.fn().mockReturnThis();
    db.limit = jest.fn().mockReturnThis();
    db.toQuery = jest.fn().mockReturnThis();
    db.then = jest.fn().mockReturnThis();
    db.raw = jest.fn().mockReturnThis();
    db.toQuery = jest.fn().mockReturnThis();
    return db;
  };

  const mockContext = {
    routeRef: 'unknown',
    pluginId: 'root',
    extension: 'App',
  };

  const mockEvent: AnalyticsEvent = {
    action: 'click',
    subject: 'button',
    context: mockContext,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should be chained to base Adapter', async () => {
    infoLog = jest.spyOn(logger, 'info');
    const db = new PostgresAdapter(mockKnex, logger);
    expect(db).toBeInstanceOf(BaseDatabaseAdapter);
  });

  it('should insert the event to the database', async () => {
    infoLog = jest.spyOn(logger, 'info');
    mockKnex.transaction = jest.fn();
    const mockTrx = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue([1]),
    });
    mockKnex.transaction.mockImplementation(async callback => {
      return callback(mockTrx as any);
    });
    const db = new PostgresAdapter(mockKnex, logger);

    const event = new Event(mockEvent);
    await db.insertEvents([event]);

    expect(infoLog).toHaveBeenCalledWith(
      '[DB] Successfully inserted 1 events in bulk',
    );
  });
  it('should throw error the user about the failed to insert into to database', async () => {
    infoLog = jest.spyOn(logger, 'info');
    const mockTrx = jest.fn().mockReturnValue({
      insert: jest.fn().mockRejectedValue(new Error('Database insert failed')),
    }) as any;
    mockKnex.transaction.mockImplementation(async callback => {
      await callback(mockTrx);
    });
    const db = new PostgresAdapter(mockKnex, logger);

    const event = new Event(mockEvent);

    await expect(db.insertEvents([event])).rejects.toThrow(
      'Database insert failed',
    );
  });

  it('should throw error the user about the failed to insert failed event into to database', async () => {
    errorLog = jest.spyOn(logger, 'error');
    mockKnex.insert.mockRejectedValue(new Error('Failed to insert'));

    const mockDatabase = jest.fn(() => mockKnex) as any;

    const db = new PostgresAdapter(mockDatabase, logger);
    const event = new Event(mockEvent);

    await db.insertFailedEvent(
      JSON.stringify(event),
      'invalid syntax error',
      3,
    );

    expect(errorLog).toHaveBeenCalledWith(
      `[DB] Error inserting failed event:`,
      expect.any(Error),
    );
    mockKnex.insert.mockReturnThis();
  });

  it('should insert the failed event to the database', async () => {
    infoLog = jest.spyOn(logger, 'info');
    const mockPostgresDb = setupDb();
    const db = new PostgresAdapter(mockPostgresDb, logger);
    const event = new Event(mockEvent);

    await db.insertFailedEvent(
      JSON.stringify(event),
      'invalid syntax error',
      3,
    );

    expect(infoLog).toHaveBeenCalledWith(
      `[DB] Failed event logged: ${JSON.stringify(event)}`,
    );
  });

  it('should return the daily users', async () => {
    const dbAdapter = jest.fn(() => mockKnex) as any;
    dbAdapter.raw = jest
      .fn()
      .mockReturnValue('mocked_raw_sql')
      .mockReturnThis();
    dbAdapter.groupByRaw = jest.fn();
    dbAdapter.toQuery = jest.fn();
    dbAdapter.from = jest.fn().mockReturnThis();
    dbAdapter.select = jest.fn().mockReturnThis();
    dbAdapter.leftJoin = jest.fn().mockReturnThis();
    dbAdapter.groupBy = jest.fn().mockReturnThis();
    dbAdapter.orderBy = jest.fn().mockReturnThis();
    dbAdapter.then = jest.fn().mockResolvedValue({});

    const db = new PostgresAdapter(dbAdapter, logger);

    const filters = {
      type: 'active_users',
      start_date: '2024-03-01',
      end_date: '2024-03-31',
    };
    db.setFilters(filters);
    await db.getDailyUsers();

    expect(mockKnex.whereBetween).toHaveBeenCalledWith('created_at', [
      filters.start_date,
      filters.end_date,
    ]);
    expect(dbAdapter.groupBy).toHaveBeenCalledWith('ge.date');
    expect(dbAdapter.orderBy).toHaveBeenCalledWith('ge.date');
  });

  describe('getTopPluginViews', () => {
    it('should return the top plugins count without any errors', async () => {
      infoLog = jest.spyOn(logger, 'info');
      const p_db = setupDb();
      p_db.with = jest.fn().mockImplementation((_: any, callback: any) => {
        return callback(p_db);
      });

      const mockPluginCount = [
        {
          plugin_id: 'catalog',
          visit_count: '27',
          trend: [
            {
              date: '2025-03-01',
              count: 10,
            },
            {
              date: '2025-03-02',
              count: 17,
            },
          ],
          trend_percentage: '70.00',
        },
      ];
      p_db.then = jest.fn().mockImplementation(() => mockPluginCount);
      const db = new PostgresAdapter(p_db, logger);
      db.setFilters({
        start_date: new Date('2025-03-01').toISOString(),
        end_date: new Date('2025-03-02').toISOString(),
      });

      const result = await db.getTopPluginViews();
      expect(result).toEqual(mockPluginCount);
    });
  });

  describe('getUsers', () => {
    it('should return the users count', async () => {
      const usersCount = [
        {
          logged_in_users: 1,
          licensed_users: 100,
        },
      ];

      const mockpostgresDb = jest.fn().mockReturnValue({
        ...mockKnex,
        then: jest.fn().mockImplementation(cb => cb(usersCount)),
      }) as any;

      mockpostgresDb.raw = jest
        .fn()
        .mockReturnValue('COUNT(*) as logged_in_users');

      const db = new PostgresAdapter(mockpostgresDb, logger);
      db.setConfig({ licensedUsers: 10 });
      db.setFilters({
        start_date: new Date('2025-03-02').toISOString(),
        end_date: new Date('2025-03-05').toISOString(),
      });
      const result = await db.getUsers();
      expect(result).toEqual({ data: usersCount });
    });
  });

  describe('modifyDateInObject', () => {
    it('should modify the date in the given object', async () => {
      const object = {
        date: '2025-03-02 23:30:00',
        count: 100,
      };
      const db = new PostgresAdapter(mockKnex, logger);
      expect(db.modifyDateInObject(object)).toEqual({
        count: 100,
        date: '2025-03-02 23:30:00 UTC',
      });
    });
    it('should return the original object if the date is not present in the given object', async () => {
      const object = {
        count: 100,
        grouping: 'daily',
      };
      const db = new PostgresAdapter(mockKnex, logger);
      expect(db.modifyDateInObject(object)).toEqual(object);
    });
  });

  describe('getResponseData', () => {
    it('should return the object wrapped in data and date should be converted to timestamp', async () => {
      const object = [
        {
          date: '2025-03-02 23:30:00',
          count: 100,
        },
      ];
      const db = new PostgresAdapter(mockKnex, logger);
      expect(db.getResponseData(object)).toEqual({
        data: [
          {
            ...object[0],
            date: '2025-03-02 23:30:00 UTC',
          },
        ],
      });
    });

    it('should handle the custom path', async () => {
      jest
        .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
        .mockReturnValue({
          timeZone: 'Asia/Kolkata',
        } as Intl.ResolvedDateTimeFormatOptions);
      const object = [
        {
          trend: [
            {
              date: '2025-03-02T18:00:00.000Z',
              count: 100,
            },
          ],
        },
      ];
      const db = new PostgresAdapter(mockKnex, logger);
      expect(db.getResponseData(object, 'trend')).toEqual({
        data: [
          {
            trend: [
              {
                ...object[0].trend[0],
                date: '2025-03-02 23:30:00 GMT+5:30',
              },
            ],
          },
        ],
      });
    });
  });

  describe('getResponseWithGrouping', () => {
    it('should return data and grouping strategy information', () => {
      const data = [
        {
          date: '2025-03-02T18:00:00.000Z',
          count: 1,
        },
      ];

      const db = new PostgresAdapter(mockKnex, logger);
      db.setFilters({
        start_date: new Date('2025-03-02').toISOString(),
        end_date: new Date('2025-03-05').toISOString(),
      });
      expect(db.getResponseWithGrouping(data)).toEqual({
        grouping: 'daily',
        data,
      });
    });

    it('should honour the grouping strategy passed by the user', () => {
      const data = [
        {
          date: '2025-03-02T18:00:00.000Z',
          count: 1,
        },
      ];

      const db = new PostgresAdapter(mockKnex, logger);
      db.setFilters({
        start_date: new Date('2025-03-02').toISOString(),
        end_date: new Date('2025-03-05').toISOString(),
        grouping: 'hourly',
      });
      expect(db.getResponseWithGrouping(data)).toEqual({
        grouping: 'hourly',
        data: [
          {
            ...data[0],
            date: '2025-03-02 23:30:00 GMT+5:30',
          },
        ],
      });
    });

    it('should work with the custom path', () => {
      const data = [
        {
          trend: [
            {
              date: '2025-03-02T18:00:00.000Z',
              count: 1,
            },
          ],
        },
      ];

      const db = new PostgresAdapter(mockKnex, logger);
      db.setFilters({
        start_date: new Date('2025-03-02').toISOString(),
        end_date: new Date('2025-03-05').toISOString(),
        grouping: 'hourly',
      });

      expect(db.getResponseWithGrouping(data, 'trend')).toEqual({
        grouping: 'hourly',
        data: [
          {
            trend: [
              {
                ...data[0].trend[0],
                date: '2025-03-02 23:30:00 GMT+5:30',
              },
            ],
          },
        ],
      });
    });
  });

  describe('ensureFiltersSet', () => {
    it('should throw error if the filters are not', () => {
      const db = new PostgresAdapter(mockKnex, logger);

      expect(() => db.ensureFiltersSet()).toThrow(
        'Filters must be set using setFilters() before calling methods',
      );
    });
  });
});
