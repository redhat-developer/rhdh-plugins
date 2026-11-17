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
import { AdoptionInsightsAnalyticsApi } from './AdoptionInsightsAnalyticsApi';
import {
  IdentityApi,
  ConfigApi,
  AnalyticsEvent,
} from '@backstage/core-plugin-api';

jest.useFakeTimers();

describe('InsightsAnalyticsApi', () => {
  let mockConfigApi: ConfigApi;
  let mockIdentityApi: IdentityApi;
  let insightsAnalyticsApi: AdoptionInsightsAnalyticsApi;
  const flushInterval = 5000;
  const maxBufferSize = 20;
  const mockContext = {
    routeRef: 'unknown',
    pluginId: 'root',
    extension: 'App',
  };

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn().mockReturnValue('http://localhost:3000'),
      getOptionalNumber: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.analytics.adoptionInsights.flushInterval')
          return flushInterval;
        if (key === 'app.analytics.adoptionInsights.maxBufferSize')
          return maxBufferSize;
        return undefined;
      }),
      getOptionalBoolean: jest.fn(),
    } as unknown as ConfigApi;

    mockIdentityApi = {
      getBackstageIdentity: jest
        .fn()
        .mockResolvedValue({ userEntityRef: 'user:test' }),
      getCredentials: jest.fn().mockResolvedValue({ token: 'dummy-token' }),
    } as unknown as IdentityApi;

    insightsAnalyticsApi = AdoptionInsightsAnalyticsApi.fromConfig(
      mockConfigApi,
      {
        identityApi: mockIdentityApi,
      },
    );
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    jest.spyOn(global.console, 'log');
    jest
      .spyOn(insightsAnalyticsApi as any, 'hash')
      .mockResolvedValue('dummy-hashed-user-id');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    expect(insightsAnalyticsApi).toBeDefined();
  });

  it('should add events to the pending buffer until user identity is available', async () => {
    const event: AnalyticsEvent = {
      action: 'click',
      subject: 'button',
      context: mockContext,
    };

    mockIdentityApi = {
      getBackstageIdentity: jest
        .fn()
        .mockResolvedValue({ userEntityRef: 'user:test' }),
      getCredentials: jest.fn().mockResolvedValue({ token: 'dummy-token' }),
    } as unknown as IdentityApi;

    insightsAnalyticsApi = AdoptionInsightsAnalyticsApi.fromConfig(
      mockConfigApi,
      {
        identityApi: mockIdentityApi,
      },
    );

    jest
      .spyOn(insightsAnalyticsApi as any, 'hash')
      .mockResolvedValue('dummy-hashed-user-id');

    await insightsAnalyticsApi.captureEvent(event);
    const pendingEvents = Object.getOwnPropertyDescriptor(
      insightsAnalyticsApi,
      'pendingEvents',
    )?.value;

    expect(pendingEvents).toHaveLength(1);
  });

  it('should buffer events before flushing', async () => {
    const event: AnalyticsEvent = {
      action: 'click',
      subject: 'button',
      context: mockContext,
    };
    await insightsAnalyticsApi.captureEvent(event);
    jest.advanceTimersByTime(flushInterval);
    expect(fetch).toHaveBeenCalled();
  });

  it('should hash user ID before capturing event', async () => {
    const event: AnalyticsEvent = {
      action: 'click',
      subject: 'button',
      context: mockContext,
    };
    await insightsAnalyticsApi.captureEvent(event);
    expect(event.context.userId).toBe('dummy-hashed-user-id');
  });

  it('should flush events when buffer reaches max size', async () => {
    for (let i = 0; i < maxBufferSize; i++) {
      await insightsAnalyticsApi.captureEvent({
        action: 'event',
        subject: `test-${i}`,
        context: mockContext,
      });
    }
    expect(fetch).toHaveLength(0); // Should be flushed
  });

  it('should flush events at regular intervals', async () => {
    await insightsAnalyticsApi.captureEvent({
      action: 'event',
      subject: 'test',
      context: mockContext,
    });
    jest.advanceTimersByTime(flushInterval);
    expect(fetch).toHaveLength(0);
  });

  it('should log events to console if debug mode is enabled', async () => {
    mockConfigApi.getOptionalBoolean = jest.fn().mockReturnValue(true);
    insightsAnalyticsApi = AdoptionInsightsAnalyticsApi.fromConfig(
      mockConfigApi,
      {
        identityApi: mockIdentityApi,
      },
    );
    jest
      .spyOn(insightsAnalyticsApi as any, 'hash')
      .mockResolvedValue('dummy-hashed-user-id');
    await insightsAnalyticsApi.captureEvent({
      action: 'event',
      subject: 'test',
      context: mockContext,
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  describe('flushEvents response handling', () => {
    const event: AnalyticsEvent = {
      action: 'click',
      subject: 'button',
      context: { ...mockContext },
    };
    const getBuffer = () =>
      (insightsAnalyticsApi as any).eventBuffer as AnalyticsEvent[];
    const flush = () =>
      (insightsAnalyticsApi as any).flushEvents() as Promise<void>;

    beforeEach(() => {
      (insightsAnalyticsApi as any).eventBuffer = [event];
    });

    it('clears the sent batch after a successful response', async () => {
      await flush();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/adoption-insights/events',
        expect.objectContaining({ body: JSON.stringify([event]) }),
      );
      expect(getBuffer()).toEqual([]);
    });

    it.each([400, 401, 413])(
      'logs and drops the batch after an HTTP %s response',
      async status => {
        jest.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status,
        } as Response);
        const errorLog = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        await flush();

        expect(getBuffer()).toEqual([]);
        expect(errorLog).toHaveBeenCalledWith(
          expect.stringContaining(`HTTP ${status}; dropping batch of 1`),
        );
      },
    );

    it('logs and requeues the batch after an HTTP 500 response', async () => {
      jest.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
      const errorLog = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await flush();

      expect(getBuffer()).toEqual([event]);
      expect(errorLog).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 500; requeuing batch of 1'),
      );
    });

    it('logs and requeues the batch after a network error', async () => {
      const networkError = new Error('Network unavailable');
      jest.mocked(fetch).mockRejectedValueOnce(networkError);
      const errorLog = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await flush();

      expect(getBuffer()).toEqual([event]);
      expect(errorLog).toHaveBeenCalledWith(
        'Failed to send analytics events, adding the events back to the queue:',
        networkError,
      );
    });
  });
});
