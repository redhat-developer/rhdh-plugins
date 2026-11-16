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
  AnalyticsApi as LegacyAnalyticsApi,
  AnalyticsEvent as LegacyAnalyticsEvent,
  IdentityApi,
  ConfigApi,
} from '@backstage/core-plugin-api';
import {
  AnalyticsEvent,
  AnalyticsImplementation,
} from '@backstage/frontend-plugin-api';

/**
 * Upper bound on events held in memory while the backend is unavailable.
 */
const MAX_QUEUED_EVENTS = 1000;

const DEFAULT_MAX_BUFFER_SIZE = 20;

/**
 * Returns the configured `maxBufferSize`, or the default if it is missing or
 * not a positive integer. Falls back instead of throwing, so a bad value
 * doesn't break every component that uses analytics.
 */
function resolveMaxBufferSize(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_MAX_BUFFER_SIZE;
  }
  if (!Number.isInteger(value) || value <= 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `app.analytics.adoptionInsights.maxBufferSize must be a positive integer, got ${value}; using the default of ${DEFAULT_MAX_BUFFER_SIZE}.`,
    );
    return DEFAULT_MAX_BUFFER_SIZE;
  }
  return value;
}

/**
 * Analytics API for Adoption Insights
 *
 * @public
 */
export class AdoptionInsightsAnalyticsApi
  implements LegacyAnalyticsApi, AnalyticsImplementation
{
  private eventBuffer: (AnalyticsEvent | LegacyAnalyticsEvent)[] = [];
  private pendingEvents: (AnalyticsEvent | LegacyAnalyticsEvent)[] = [];
  private readonly backendUrl: string;
  private readonly flushInterval: number;
  private readonly maxBufferSize: number;
  private readonly debug?: boolean;
  private userId?: string;
  private userToken?: string;
  private isUserIdentityAvailable?: boolean;
  private isFlushing = false;

  private constructor(
    backendUrl: string,
    flushInterval: number,
    maxBufferSize: number,
    identityApi: IdentityApi,
    debug?: boolean,
  ) {
    this.backendUrl = backendUrl;
    this.flushInterval = flushInterval;
    this.maxBufferSize = maxBufferSize;
    this.debug = debug;
    this.isUserIdentityAvailable = false;

    identityApi.getBackstageIdentity().then(async identity => {
      const { token } = await identityApi.getCredentials();
      this.userToken = token;
      this.userId = identity.userEntityRef;

      await Promise.all(
        this.pendingEvents.map(event => this.setUserIdToEvent(event)),
      );

      this.isUserIdentityAvailable = true;
      // Pending events are older than anything in `eventBuffer`, so they go
      // first. This keeps the buffer oldest-first for `enforceQueueLimit`.
      this.eventBuffer.unshift(...this.pendingEvents);
      this.pendingEvents = [];
      this.enforceQueueLimit();
    });

    setInterval(() => this.flushEvents(), this.flushInterval);
  }

  private async setUserIdToEvent(event: AnalyticsEvent | LegacyAnalyticsEvent) {
    if (this.userId) {
      event.context.userName = this.userId;
      event.context.userId = await this.hash(this.userId);
    }
    return event;
  }
  /**
   * initialize the Analytics API for Adoption Insights fromm config
   */
  static fromConfig(config: ConfigApi, options: { identityApi: IdentityApi }) {
    const backendUrl = `${config.getString(
      'backend.baseUrl',
    )}/api/adoption-insights`;
    const flushInterval =
      config.getOptionalNumber(
        'app.analytics.adoptionInsights.flushInterval',
      ) || 5000;
    const maxBufferSize = resolveMaxBufferSize(
      config.getOptionalNumber('app.analytics.adoptionInsights.maxBufferSize'),
    );
    const debug =
      config.getOptionalBoolean('app.analytics.adoptionInsights.debug') ||
      false;

    return new AdoptionInsightsAnalyticsApi(
      backendUrl,
      flushInterval,
      maxBufferSize,
      options.identityApi,
      debug,
    );
  }
  /**
   *  Capture events being emmited from Analytics API and send to the Adoption Insights Backend
   */
  async captureEvent(event: AnalyticsEvent | LegacyAnalyticsEvent) {
    if (this.userId) {
      event.context.userName = this.userId;
      event.context.userId = await this.hash(this.userId);
    }
    event.context.timestamp = new Date().toISOString();

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('Adoption Insights Analytics Event -', event);
    }
    if (this.isUserIdentityAvailable) {
      this.eventBuffer.push(event);
      this.enforceQueueLimit();
    } else {
      this.pendingEvents.push(event);
    }

    // Flush immediately if buffer reaches threshold
    if (this.eventBuffer.length >= this.maxBufferSize) {
      await this.flushEvents();
    }
  }

  /**
   * Sends buffered events in batches of at most `maxBufferSize`, so that a
   * backlog accumulated while the backend was unavailable never exceeds the
   * backend's per-request limit. Batches rejected with HTTP 4xx are dropped;
   * on a network error or HTTP 5xx the failed batch and all remaining events
   * are requeued and sending stops until the next flush.
   *
   * Only one flush runs at a time. A flush requested while another is in
   * progress is skipped; events captured meanwhile are sent by the next
   * interval flush.
   */
  private async flushEvents() {
    if (this.isFlushing || this.eventBuffer.length === 0) return;

    this.isFlushing = true;
    const eventsToSend = this.eventBuffer;
    this.eventBuffer = []; // Clear buffer before sending to avoid blocking new events

    try {
      for (let i = 0; i < eventsToSend.length; i += this.maxBufferSize) {
        const batch = eventsToSend.slice(i, i + this.maxBufferSize);
        const sent = await this.sendBatch(batch);
        if (!sent) {
          this.requeue(eventsToSend.slice(i));
          return;
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Sends a single batch. Returns `false` if the batch should be retried.
   */
  private async sendBatch(
    batch: (AnalyticsEvent | LegacyAnalyticsEvent)[],
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.userToken && { Authorization: `Bearer ${this.userToken}` }),
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const retryable = response.status >= 500;
        // eslint-disable-next-line no-console
        console.error(
          `Failed to send analytics events: HTTP ${response.status}; ${
            retryable ? 'requeuing' : 'dropping'
          } batch of ${batch.length}.`,
        );
        return !retryable;
      }
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to send analytics events: network error; requeuing batch of ${batch.length}.`,
        error,
      );
      return false;
    }
  }

  /**
   * Puts unsent events back at the front of the buffer, ahead of any events
   * captured while they were being sent.
   */
  private requeue(events: (AnalyticsEvent | LegacyAnalyticsEvent)[]) {
    this.eventBuffer.unshift(...events);
    this.enforceQueueLimit();
  }

  /**
   * Drops the oldest events if the buffer exceeds `MAX_QUEUED_EVENTS`.
   * Relies on `eventBuffer` being kept in capture order, oldest first.
   */
  private enforceQueueLimit() {
    const overflow = this.eventBuffer.length - MAX_QUEUED_EVENTS;
    if (overflow > 0) {
      this.eventBuffer.splice(0, overflow);
      // eslint-disable-next-line no-console
      console.error(
        `Analytics event queue exceeded ${MAX_QUEUED_EVENTS} events; dropped ${overflow} oldest ${
          overflow === 1 ? 'event' : 'events'
        }.`,
      );
    }
  }

  /**
   * Simple hash function; relies on web cryptography + the sha-256 algorithm.
   * @param value - value to be hashed
   */
  private async hash(value: string): Promise<string> {
    const digest = await window.crypto.subtle.digest(
      'sha-256',
      new TextEncoder().encode(value),
    );
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
