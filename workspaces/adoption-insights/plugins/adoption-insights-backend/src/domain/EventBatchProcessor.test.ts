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
import { LoggerService } from '@backstage/backend-plugin-api';
import { AnalyticsEvent } from '@backstage/core-plugin-api';
import { EventBatchProcessor } from './EventBatchProcessor';
import { EventDatabase } from '../database/event-database';
import { Event } from '../models/Event';

describe('EventBatchProcessor', () => {
  let mockRetryOrStoreFailedEvent: jest.SpyInstance;

  const mockInsertEvents = jest.fn();
  const mockInsertFailedEvent = jest.fn();
  const mockEventDatabase: jest.Mocked<EventDatabase> = {
    getUsers: jest.fn().mockReturnThis(),
    setConfig: jest.fn().mockReturnThis(),
    setFilters: jest.fn().mockReturnThis(),
    isJsonSupported: jest.fn().mockReturnValue(true),
    isPartitionSupported: jest.fn().mockReturnValue(true),
    insertEvents: mockInsertEvents.mockResolvedValue(undefined),
    insertFailedEvent: mockInsertFailedEvent.mockResolvedValue(undefined),
    getDailyUsers: jest.fn().mockReturnValue({} as Knex.QueryBuilder),
    getTopSearches: jest.fn().mockReturnValue({} as Knex.QueryBuilder),
    getTopPluginViews: jest.fn().mockReturnValue({} as Knex.QueryBuilder),
    getTopTemplateViews: jest.fn().mockReturnValue({} as Knex.QueryBuilder),
    getTopTechDocsViews: jest.fn().mockReturnValue({} as Knex.QueryBuilder),
    getTopCatalogEntitiesViews: jest
      .fn()
      .mockReturnValue({} as Knex.QueryBuilder),
  };

  const mockLogger: jest.Mocked<LoggerService> = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnValue({} as LoggerService), // If `child()` is used, return another mock logger
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

  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should return batch processor instance', () => {
    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
    });
    expect(processor).toBeInstanceOf(EventBatchProcessor);
  });

  it('should add event to the queue', () => {
    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      debug: true,
    });
    const event = new Event(mockEvent);
    processor.addEvent(event);

    expect(mockLogger.info).toHaveBeenCalledWith(
      `[QUEUE] Event added: ${JSON.stringify(event.toJSON())}`,
    );
  });

  it('should not add the same event twice to the queue', () => {
    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
    });
    const event = new Event(mockEvent);
    processor.addEvent(event);
    processor.addEvent({ ...event, toJSON: event.toJSON });

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `[QUEUE] Event added: ${JSON.stringify(event.toJSON())}`,
    );
  });

  it('should insert the event into the database', () => {
    jest.useFakeTimers();

    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      batchInterval: 1000,
    });
    const event = new Event(mockEvent);
    processor.addEvent(event);

    jest.advanceTimersByTime(1000);

    expect(mockInsertEvents).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockInsertEvents).toHaveBeenCalledWith([
      { ...event, toJSON: event.toJSON },
    ]);
  });

  it('should retry failed events and store the failed event into the database', async () => {
    jest.useFakeTimers();

    mockInsertEvents.mockRejectedValue(new Error('Database insert failed'));

    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      batchInterval: 1000,
    });

    const event = new Event(mockEvent);
    processor.addEvent(event);

    jest.advanceTimersByTime(1000);
    expect(mockEventDatabase.insertEvents).toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(mockEventDatabase.insertEvents).toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(mockEventDatabase.insertEvents).toHaveBeenCalled();
  });

  it('should handle insert failure and call retry logic', async () => {
    const dbInsertError = new Error('Database insert failed');
    mockInsertEvents.mockRejectedValue(dbInsertError);

    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      batchInterval: 1000, // Runs every 1 second
    });

    mockRetryOrStoreFailedEvent = jest.spyOn(
      processor,
      'retryOrStoreFailedEvent',
    );

    const event = new Event(mockEvent);
    processor.addEvent(event);

    await processor.processEvents();

    expect(mockEventDatabase.insertEvents).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      `[ERROR] Batch insert failed:`,
      dbInsertError,
    );
    expect(mockRetryOrStoreFailedEvent).toHaveBeenCalledTimes(1);
  });

  it('should retry upto maxRetries times, on failure save the data to the Database', async () => {
    jest.useFakeTimers();
    const dbInsertError = new Error('Database insert failed');
    mockInsertEvents.mockRejectedValue(dbInsertError);

    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      batchInterval: 1000,
    });

    const event = new Event(mockEvent);
    processor.addEvent(event);

    await processor.processEvents();
    await processor.processEvents();
    await processor.processEvents();
    // after maxRetries(3 times) processing events should store it in DB.
    await processor.processEvents();

    expect(mockLogger.error).toHaveBeenCalledWith(
      `[DROPPED] Event permanently failed, storing in DB: ${JSON.stringify(
        event,
      )}`,
    );
  });

  it('should catch the error if the insertion of failed event to Database fails', async () => {
    expect.assertions(1);
    const dbInsertError = new Error('Database insert failed');
    mockEventDatabase.insertFailedEvent.mockRejectedValue(dbInsertError);

    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      batchInterval: 1000,
    });

    const event = new Event(mockEvent);
    await processor.storeFailedEvent(event, 'Test error message');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `[DB-ERROR] Failed to store event in DB:`,
      expect.any(Error),
    );
  });

  it('should call logQueueStats every 5 seconds', async () => {
    jest.useFakeTimers();
    const processor = new EventBatchProcessor(mockEventDatabase, mockLogger, {
      batchSize: 10,
      debug: true,
    });
    const event = new Event(mockEvent);
    await processor.storeFailedEvent(event, 'Test error message');

    jest.advanceTimersByTime(5000);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
