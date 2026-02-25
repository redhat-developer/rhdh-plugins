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
      this.isUserIdentityAvailable = true;

      await Promise.all(
        this.pendingEvents.map(event => this.setUserIdToEvent(event)),
      );

      this.eventBuffer.push(...this.pendingEvents);

      this.pendingEvents = [];
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
    const maxBufferSize =
      config.getOptionalNumber(
        'app.analytics.adoptionInsights.maxBufferSize',
      ) || 20;
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
    } else {
      this.pendingEvents.push(event);
    }

    // Flush immediately if buffer reaches threshold
    if (this.eventBuffer.length >= this.maxBufferSize) {
      await this.flushEvents();
    }
  }

  private async flushEvents() {
    if (this.eventBuffer.length === 0) return;

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = []; // Clear buffer before sending to avoid blocking new events

    try {
      await fetch(`${this.backendUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.userToken && { Authorization: `Bearer ${this.userToken}` }),
        },
        body: JSON.stringify(eventsToSend),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to send analytics events, adding the events back to the queue:',
        error,
      );
      // Requeue events if request fails
      this.eventBuffer.unshift(...eventsToSend);
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
