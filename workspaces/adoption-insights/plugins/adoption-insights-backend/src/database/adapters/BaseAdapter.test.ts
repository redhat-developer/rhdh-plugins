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

  const logger = mockServices.logger.mock();
  const mockKnex = {
    returning: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 1, name: 'Mocked' }),
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
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    }),
  } as unknown as jest.Mocked<Knex>;

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
    const db = new PostgresAdapter(mockKnex, logger);

    const event = new Event(mockEvent);
    await db.insertEvents([event]);

    expect(infoLog).toHaveBeenCalledWith(
      '[DB] Successfully inserted 1 events in bulk',
    );
  });

  it('should insert the failed event to the database', async () => {
    infoLog = jest.spyOn(logger, 'info');
    const mockDb = jest.fn(() => mockKnex) as any;

    const db = new PostgresAdapter(mockDb, logger);

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
    const mockDb = jest.fn(() => mockKnex) as any;
    mockDb.raw = jest.fn().mockReturnValue('mocked_raw_sql').mockReturnThis();
    mockDb.groupByRaw = jest.fn();
    mockDb.toQuery = jest.fn();
    mockDb.from = jest.fn().mockReturnThis();
    mockDb.select = jest.fn().mockReturnThis();
    mockDb.leftJoin = jest.fn().mockReturnThis();
    mockDb.groupBy = jest.fn().mockReturnThis();
    mockDb.orderBy = jest.fn().mockReturnThis();

    const db = new PostgresAdapter(mockDb, logger);

    const filters = {
      type: 'daily_users',
      start_date: '2024-03-01',
      end_date: '2024-03-31',
    };
    db.setFilters(filters);
    await db.getDailyUsers();

    expect(mockKnex.whereBetween).toHaveBeenCalledWith('created_at', [
      filters.start_date,
      filters.end_date,
    ]);
    expect(mockDb.groupBy).toHaveBeenCalledWith('ge.date');
    expect(mockDb.orderBy).toHaveBeenCalledWith('ge.date');
  });
});
