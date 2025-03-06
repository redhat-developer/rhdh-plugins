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
import { Request, Response } from 'express';
import EventApiController from './EventApiController';
import { EventDatabase } from '../database/event-database';
import { mockServices } from '@backstage/backend-test-utils';
import { EventBatchProcessor } from '../domain/EventBatchProcessor';
import {
  AnalyticsContextValue,
  AnalyticsEvent,
} from '@backstage/core-plugin-api';
import { QUERY_TYPES, QueryParams } from '../types/event-request';
import { toEndOfDayUTC, toStartOfDayUTC } from '../utils/date';

let controller: EventApiController;
let req: Partial<Request>;
let res: Partial<Response>;

const mockEventDb = {
  isJsonSupported: jest.fn(),
  setFilters: jest.fn(),
  setConfig: jest.fn(),
  getUsers: jest.fn(),
  getDailyUsers: jest.fn(),
  getTopSearches: jest.fn(),
  getTopPluginViews: jest.fn(),
  getTopTechDocsViews: jest.fn(),
  getTopTemplateViews: jest.fn(),
  getTopCatalogEntitiesViews: jest.fn(),
} as unknown as jest.Mocked<EventDatabase>;

const mockProcessor = {
  addEvent: jest.fn(),
} as unknown as jest.Mocked<EventBatchProcessor>;

const mockEvent: AnalyticsEvent = {
  action: 'test-action',
  subject: 'test-subject',
  value: 42,
  context: {
    routeRef: 'test-route',
    pluginId: 'test-plugin',
    extension: 'routeRef',
    userName: 'test-user',
    timestamp: '2025-03-02T16:25:32.819Z',
  },
  attributes: { key: 'value' },
};

describe('trackEvents', () => {
  let mockProcessIncomingEvents: jest.SpyInstance;
  let mockProcessorAddEvent: jest.SpyInstance;

  beforeEach(() => {
    controller = new EventApiController(
      mockEventDb,
      mockProcessor,
      mockServices.rootConfig.mock(),
    );

    mockProcessIncomingEvents = jest.spyOn(
      controller,
      'processIncomingEvents' as keyof EventApiController,
    );
    mockProcessorAddEvent = jest.spyOn(
      mockProcessor,
      'addEvent' as keyof EventBatchProcessor,
    );

    req = {
      body: [{ action: 'click' }] as AnalyticsEvent[],
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process events and return 200 on success', () => {
    mockProcessIncomingEvents.mockImplementation(() => {});

    controller.trackEvents(req as Request, res as Response);

    expect(mockProcessIncomingEvents).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Event received',
    });
  });

  it('should throw validation error if the request is missing some fields', () => {
    jest.clearAllMocks();
    mockProcessIncomingEvents.mockClear();
    const request = {
      body: [
        {
          context: {
            ...mockEvent.context,
            userId: 'test123',
          } as AnalyticsContextValue,
        },
      ] as AnalyticsEvent[],
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    controller.trackEvents(request as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: { action: ['Action is required'] },
      message: 'Invalid event data',
    });
  });

  it('should return 400 on failure with error message', () => {
    const error = new Error('Validation error') as any;
    error.details = { fieldErrors: ['Invalid user_ref'] };

    mockProcessIncomingEvents.mockImplementation(() => {
      throw error;
    });

    controller.trackEvents(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: ['Invalid user_ref'],
    });
  });

  it('should not process events without user information', () => {
    jest.clearAllMocks();
    mockProcessIncomingEvents.mockClear();
    const request = {
      body: [
        { action: 'click' },
        { action: 'click', context: mockEvent.context },
      ] as AnalyticsEvent[],
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    controller.trackEvents(request as Request, res as Response);

    expect(mockProcessorAddEvent).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Event received',
    });
  });

  it('should process events only with user information', () => {
    jest.clearAllMocks();
    mockProcessIncomingEvents.mockClear();
    const request = {
      body: [
        { action: 'click' },
        {
          action: 'click',
          context: {
            ...mockEvent.context,
            userId: 'test123',
          } as AnalyticsContextValue,
        },
      ] as AnalyticsEvent[],
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    controller.trackEvents(request as Request, res as Response);

    expect(mockProcessorAddEvent).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Event received',
    });
  });
});

describe('GetInsights', () => {
  beforeEach(() => {
    controller = new EventApiController(
      mockEventDb,
      mockProcessor,
      mockServices.rootConfig.mock(),
    );

    req = {
      query: {
        start_date: '2025-02-03',
        end_date: '2025-02-04',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return validation errors', () => {
    controller.getInsights(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: {
        type: [`Invalid type. Allowed values: ${QUERY_TYPES.join(',')}`],
      },
      message: 'Invalid query',
    });
  });

  it('should set configuration and filters', async () => {
    req.query = {
      ...req.query,
      type: 'total_users',
    };
    await controller.getInsights(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      res as Response,
    );

    expect(mockEventDb.setFilters).toHaveBeenCalledWith({
      start_date: toStartOfDayUTC(req.query?.start_date as string),
      end_date: toEndOfDayUTC(req.query?.end_date as string),
    });

    expect(mockEventDb.setConfig).toHaveBeenCalledWith({
      licensedUsers: 100,
    });
  });

  it('should call the api endpoints based on type', () => {
    QUERY_TYPES.forEach(type => {
      req.query = {
        ...req.query,
        type: type,
      };

      controller.getInsights(
        req as unknown as Request<{}, {}, {}, QueryParams>,
        res as Response,
      );
    });

    expect(mockEventDb.getUsers).toHaveBeenCalled();
    expect(mockEventDb.getDailyUsers).toHaveBeenCalled();
    expect(mockEventDb.getTopSearches).toHaveBeenCalled();
    expect(mockEventDb.getTopPluginViews).toHaveBeenCalled();
    expect(mockEventDb.getTopTemplateViews).toHaveBeenCalled();
    expect(mockEventDb.getTopTechDocsViews).toHaveBeenCalled();
    expect(mockEventDb.getTopCatalogEntitiesViews).toHaveBeenCalled();
  });

  it('should return the csv file with correct filename', async () => {
    req.query = {
      ...req.query,
      type: 'total_users',
      format: 'csv',
    };
    res.header = jest.fn();
    res.attachment = jest.fn();
    res.send = jest.fn();

    mockEventDb.getUsers.mockResolvedValue({
      data: [{ logged_in_users: 1, licensed_users: 100 }],
    } as any);

    await controller.getInsights(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      res as Response,
    );

    expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.attachment).toHaveBeenCalledWith(
      'adoption_insights_total_users.csv',
    );
  });

  it('should throw 500 error', async () => {
    mockEventDb.getUsers.mockClear();
    req.query = {
      ...req.query,
      type: 'total_users',
    };

    mockEventDb.getUsers.mockRejectedValue(new Error('Something went wrong'));

    await controller.getInsights(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
