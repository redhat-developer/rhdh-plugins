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
import { TechDocsCount, TopTechDocsCount } from '../types/event';

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
  getTechdocsMetadata: jest.fn(),
} as unknown as jest.Mocked<EventDatabase>;

const mockProcessor = {
  addEvent: jest.fn(),
} as unknown as jest.Mocked<EventBatchProcessor>;

const mockAuditor = {
  createEvent: jest.fn().mockResolvedValue({
    success: jest.fn(),
    fail: jest.fn(),
  }),
} as any;

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
      mockAuditor,
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

  it('should process events and return 200 on success', async () => {
    mockProcessIncomingEvents.mockImplementation(() => {});

    await controller.trackEvents(req as Request, res as Response);

    expect(mockProcessIncomingEvents).toHaveBeenCalledWith(
      req.body,
      expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Event received',
    });
  });

  it('should throw validation error if the request is missing some fields', async () => {
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
    await controller.trackEvents(request as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: {
        action: ['Action is required'],
      },
      message: 'Invalid event data',
    });
  });

  it('should return 400 on failure with error message', async () => {
    const error = new Error('Validation error') as any;
    error.details = { fieldErrors: ['Invalid user_ref'] };

    mockProcessIncomingEvents.mockImplementation(() => {
      throw error;
    });

    await controller.trackEvents(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: ['Invalid user_ref'],
    });
  });

  it('should not process events without user information', async () => {
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
    await controller.trackEvents(request as Request, res as Response);

    expect(mockProcessorAddEvent).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Event received',
    });
  });

  it('should process events only with user information', async () => {
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
    await controller.trackEvents(request as Request, res as Response);

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
      mockAuditor,
    );

    global.fetch = jest.fn().mockResolvedValue({} as any);

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

  it('should return validation errors', async () => {
    await controller.getInsights(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: {
        type: [`Invalid type. Allowed values: ${QUERY_TYPES}`],
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

  it('should call the api endpoints based on type', async () => {
    // Mock return values for all database methods as QueryBuilders
    mockEventDb.getUsers.mockResolvedValue({} as any);
    mockEventDb.getDailyUsers.mockResolvedValue({} as any);
    mockEventDb.getTopSearches.mockResolvedValue({} as any);
    mockEventDb.getTopPluginViews.mockResolvedValue({} as any);
    mockEventDb.getTopTemplateViews.mockResolvedValue({} as any);
    mockEventDb.getTopTechDocsViews.mockResolvedValue({} as any);
    mockEventDb.getTopCatalogEntitiesViews.mockResolvedValue({} as any);

    for (const type of QUERY_TYPES) {
      req.query = {
        ...req.query,
        type: type,
      };

      await controller.getInsights(
        req as unknown as Request<{}, {}, {}, QueryParams>,
        res as Response,
      );
    }

    expect(mockEventDb.getUsers).toHaveBeenCalled();
    expect(mockEventDb.getDailyUsers).toHaveBeenCalled();
    expect(mockEventDb.getTopSearches).toHaveBeenCalled();
    expect(mockEventDb.getTopPluginViews).toHaveBeenCalled();
    expect(mockEventDb.getTopTemplateViews).toHaveBeenCalled();
    expect(mockEventDb.getTopTechDocsViews).toHaveBeenCalled();
    expect(mockEventDb.getTopCatalogEntitiesViews).toHaveBeenCalled();
  });

  it('should call getTechdocsMetadata method', async () => {
    req.query = {
      ...req.query,
      type: 'top_techdocs',
    };

    const getTechdocsMetadata = jest.fn();

    controller.getTechdocsMetadata = getTechdocsMetadata;
    await controller.getInsights(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      res as Response,
    );

    expect(mockEventDb.getTopTechDocsViews).toHaveBeenCalled();
    expect(getTechdocsMetadata).toHaveBeenCalled();
  });

  const setupTechdocsTest = (site_name: string | undefined) => {
    req.query = {
      ...req.query,
      type: 'top_techdocs',
    };
    req.headers = {
      authorization: 'Bearer test-token',
    };

    (fetch as jest.Mock).mockResolvedValue(
      new global.Response(JSON.stringify({ site_name }), {
        status: 200,
      }),
    );
  };
  const getTechdocsResult = (name: string): TopTechDocsCount => {
    return {
      data: [
        {
          count: 1,
          last_used: new Date().toISOString(),
          name,
          kind: 'component',
          namespace: 'default',
        } as TechDocsCount,
      ],
    };
  };

  it('should append site_name metadata for a valid document', async () => {
    setupTechdocsTest('app-docs');
    const result = getTechdocsResult('test-component');

    await controller.getTechdocsMetadata(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      result,
    );

    expect(result.data[0].site_name).toBe('app-docs');
  });

  it('should return empty site_name for document root page', async () => {
    setupTechdocsTest('app-docs');
    const result = getTechdocsResult('');

    await controller.getTechdocsMetadata(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      result,
    );

    expect(result.data[0].site_name).toBe('');
  });

  it('should return component name as site_name for non-existing or deleted document', async () => {
    setupTechdocsTest(undefined);
    const result = getTechdocsResult('deleted-document');

    await controller.getTechdocsMetadata(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      result,
    );

    expect(result.data[0].site_name).toBe('deleted-document');
  });

  it('should handle techdocs metadata API gracefully', async () => {
    setupTechdocsTest('deleted-document');

    (fetch as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch techdocs metadata'),
    );

    const result = {
      data: [
        {
          count: 1,
          last_used: new Date().toISOString(),
          name: 'app-docs',
          kind: 'component',
          namespace: 'default',
        } as TechDocsCount,
      ],
    };

    await controller.getTechdocsMetadata(
      req as unknown as Request<{}, {}, {}, QueryParams>,
      result,
    );

    expect(result.data[0].site_name).toBe('app-docs');
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
