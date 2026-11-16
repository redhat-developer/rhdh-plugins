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
        expect.stringContaining('network error; requeuing batch of 1'),
        networkError,
      );
    });

    it('skips a flush requested while another flush is in progress', async () => {
      let resolveFetch: (response: Response) => void = () => {};
      jest.mocked(fetch).mockReturnValueOnce(
        new Promise<Response>(resolve => {
          resolveFetch = resolve;
        }),
      );

      const firstFlush = flush();
      const newEvent: AnalyticsEvent = { ...event, subject: 'new-button' };
      getBuffer().push(newEvent);
      await flush();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(getBuffer()).toEqual([newEvent]);

      resolveFetch({ ok: true } as Response);
      await firstFlush;
      await flush();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify([newEvent]) }),
      );
      expect(getBuffer()).toEqual([]);
    });

    it('releases the flush lock after a failed flush', async () => {
      jest
        .mocked(fetch)
        .mockRejectedValueOnce(new Error('Network unavailable'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await flush();
      await flush();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(getBuffer()).toEqual([]);
    });

    describe('backlog larger than maxBufferSize', () => {
      const makeEvents = (count: number): AnalyticsEvent[] =>
        Array.from({ length: count }, (_, i) => ({
          action: 'click',
          subject: `button-${i}`,
          context: { ...mockContext },
        }));
      const sentBatches = () =>
        jest
          .mocked(fetch)
          .mock.calls.map(
            ([, init]) => JSON.parse(init!.body as string) as AnalyticsEvent[],
          );

      beforeEach(() => {
        jest.mocked(fetch).mockClear();
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      it('sends the backlog in batches of at most maxBufferSize', async () => {
        const events = makeEvents(maxBufferSize * 2 + 5);
        (insightsAnalyticsApi as any).eventBuffer = [...events];

        await flush();

        expect(sentBatches().map(b => b.length)).toEqual([
          maxBufferSize,
          maxBufferSize,
          5,
        ]);
        expect(sentBatches().flat()).toEqual(events);
        expect(getBuffer()).toEqual([]);
      });

      it('requeues the failed batch and the rest on a 5xx, then stops', async () => {
        const events = makeEvents(maxBufferSize * 3);
        (insightsAnalyticsApi as any).eventBuffer = [...events];
        jest
          .mocked(fetch)
          .mockResolvedValueOnce({ ok: true } as Response)
          .mockResolvedValueOnce({ ok: false, status: 503 } as Response);

        await flush();

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(getBuffer()).toEqual(events.slice(maxBufferSize));
      });

      it('drops a 4xx batch and continues with the remaining batches', async () => {
        const events = makeEvents(maxBufferSize * 2);
        (insightsAnalyticsApi as any).eventBuffer = [...events];
        jest
          .mocked(fetch)
          .mockResolvedValueOnce({ ok: false, status: 400 } as Response);

        await flush();

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(sentBatches()[1]).toEqual(events.slice(maxBufferSize));
        expect(getBuffer()).toEqual([]);
      });

      it('caps the requeued backlog by dropping the oldest events', async () => {
        const events = makeEvents(1005);
        (insightsAnalyticsApi as any).eventBuffer = [...events];
        jest
          .mocked(fetch)
          .mockResolvedValueOnce({ ok: false, status: 500 } as Response);
        const errorLog = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        await flush();

        expect(getBuffer()).toEqual(events.slice(5));
        expect(errorLog).toHaveBeenCalledWith(
          expect.stringContaining('dropped 5 oldest events'),
        );
      });

      it('caps the queue when new events are captured', async () => {
        const events = makeEvents(1000);
        (insightsAnalyticsApi as any).eventBuffer = [...events];
        (insightsAnalyticsApi as any).isUserIdentityAvailable = true;
        // Simulate a flush in progress so captureEvent does not send anything.
        (insightsAnalyticsApi as any).isFlushing = true;
        const errorLog = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const newEvent: AnalyticsEvent = {
          action: 'click',
          subject: 'new-button',
          context: { ...mockContext },
        };

        await insightsAnalyticsApi.captureEvent(newEvent);

        expect(fetch).not.toHaveBeenCalled();
        expect(getBuffer()).toHaveLength(1000);
        expect(getBuffer()[0]).toEqual(events[1]);
        expect(getBuffer()[999]).toBe(newEvent);
        expect(errorLog).toHaveBeenCalledWith(
          expect.stringContaining('dropped 1 oldest event.'),
        );
      });
    });
  });

  describe('identity initialization', () => {
    const makeEvent = (subject: string): AnalyticsEvent => ({
      action: 'click',
      subject,
      context: { ...mockContext },
    });
    const subjects = (events: AnalyticsEvent[]) => events.map(e => e.subject);

    /** Lets pending promise callbacks run until `condition` holds. */
    const settle = async (condition: () => boolean) => {
      for (let i = 0; i < 100 && !condition(); i++) {
        await Promise.resolve();
      }
      expect(condition()).toBe(true);
    };

    /**
     * Creates an API whose identity resolves on demand and whose hashing is
     * held until `releaseHash` is called, so tests can capture events while
     * the pending events are being hashed.
     */
    const createApiWithPausedIdentity = () => {
      let resolveIdentity: (identity: {
        userEntityRef: string;
      }) => void = () => {};
      const identityApi = {
        getBackstageIdentity: jest.fn().mockReturnValue(
          new Promise(resolve => {
            resolveIdentity = resolve;
          }),
        ),
        getCredentials: jest.fn().mockResolvedValue({ token: 'dummy-token' }),
      } as unknown as IdentityApi;
      const api = AdoptionInsightsAnalyticsApi.fromConfig(mockConfigApi, {
        identityApi,
      });

      let releaseHash: () => void = () => {};
      const hashGate = new Promise<void>(resolve => {
        releaseHash = resolve;
      });
      const hashSpy = jest
        .spyOn(api as any, 'hash')
        .mockImplementation(async () => {
          await hashGate;
          return 'dummy-hashed-user-id';
        });

      const internals = api as any;
      return {
        api,
        internals,
        startIdentityHandoff: async () => {
          resolveIdentity({ userEntityRef: 'user:test' });
          await settle(() => hashSpy.mock.calls.length > 0);
        },
        finishIdentityHandoff: async () => {
          releaseHash();
          await settle(
            () =>
              internals.isUserIdentityAvailable &&
              internals.pendingEvents.length === 0,
          );
        },
      };
    };

    it('keeps pending events ahead of events captured while they are hashed', async () => {
      const { api, internals, startIdentityHandoff, finishIdentityHandoff } =
        createApiWithPausedIdentity();
      await api.captureEvent(makeEvent('captured-before-identity'));

      await startIdentityHandoff();
      const capturing = api.captureEvent(makeEvent('captured-during-handoff'));
      await finishIdentityHandoff();
      await capturing;

      expect(subjects(internals.eventBuffer)).toEqual([
        'captured-before-identity',
        'captured-during-handoff',
      ]);
    });

    it('drops the oldest pending events, not newer captures, when the cap is exceeded', async () => {
      const { api, internals, startIdentityHandoff, finishIdentityHandoff } =
        createApiWithPausedIdentity();
      const pending = Array.from({ length: 1000 }, (_, i) =>
        makeEvent(`pending-${i}`),
      );
      internals.pendingEvents = [...pending];
      // Keep captureEvent from flushing, so the whole queue can be inspected.
      internals.isFlushing = true;
      const errorLog = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await startIdentityHandoff();
      const capturing = api.captureEvent(makeEvent('captured-during-handoff'));
      await finishIdentityHandoff();
      await capturing;

      const buffer = internals.eventBuffer as AnalyticsEvent[];
      expect(buffer).toHaveLength(1000);
      expect(buffer[0].subject).toBe('pending-1');
      expect(buffer[999].subject).toBe('captured-during-handoff');
      expect(errorLog).toHaveBeenCalledWith(
        expect.stringContaining('dropped 1 oldest event.'),
      );
    });
  });

  describe('maxBufferSize configuration', () => {
    const createApiWithMaxBufferSize = (value: number | undefined) => {
      const config = {
        getString: jest.fn().mockReturnValue('http://localhost:3000'),
        getOptionalNumber: jest
          .fn()
          .mockImplementation((key: string) =>
            key === 'app.analytics.adoptionInsights.maxBufferSize'
              ? value
              : undefined,
          ),
        getOptionalBoolean: jest.fn(),
      } as unknown as ConfigApi;
      return AdoptionInsightsAnalyticsApi.fromConfig(config, {
        identityApi: mockIdentityApi,
      });
    };

    it('uses the default of 20 when maxBufferSize is not set', () => {
      const warnLog = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const api = createApiWithMaxBufferSize(undefined);

      expect((api as any).maxBufferSize).toBe(20);
      expect(warnLog).not.toHaveBeenCalled();
    });

    it('uses a valid configured maxBufferSize', () => {
      const api = createApiWithMaxBufferSize(50);

      expect((api as any).maxBufferSize).toBe(50);
    });

    it.each([0, -5, 2.5, Number.NaN])(
      'falls back to the default and warns when maxBufferSize is %s',
      value => {
        const warnLog = jest
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const api = createApiWithMaxBufferSize(value);

        expect((api as any).maxBufferSize).toBe(20);
        expect(warnLog).toHaveBeenCalledWith(
          expect.stringContaining('must be a positive integer'),
        );
      },
    );
  });
});
