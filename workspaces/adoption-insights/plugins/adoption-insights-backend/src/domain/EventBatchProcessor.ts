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
import { LoggerService } from '@backstage/backend-plugin-api';
import { EventDatabase } from '../database/event-database';
import { Event } from '../models/Event';

export type ProcessorConfigOptions = {
  debug?: boolean;
  batchSize?: number;
  maxRetries?: number;
  batchInterval?: number;
};
export class EventBatchProcessor {
  private readonly queue: Event[];
  private processing: boolean;
  private readonly batchSize: number;
  private readonly batchInterval: number;
  private readonly maxRetries: number;
  private readonly failedEvents: any;
  private readonly database: EventDatabase;
  private readonly logger: LoggerService;
  private readonly debug: boolean;

  constructor(
    database: EventDatabase,
    logger: LoggerService,
    options: ProcessorConfigOptions,
  ) {
    this.queue = [];
    this.logger = logger;
    this.processing = false;
    this.database = database;
    this.failedEvents = new Map();
    this.debug = options.debug || false;

    const { batchSize = 5, maxRetries = 3, batchInterval = 2000 } = options;

    this.batchSize = batchSize;
    this.maxRetries = maxRetries;
    this.batchInterval = batchInterval;

    setInterval(() => this.processEvents(), this.batchInterval);
    setInterval(() => this.logQueueStats(), 5000);
  }

  addEvent(event: Event) {
    if (
      !this.queue.some((existingEvent: Event) => existingEvent.id === event.id)
    ) {
      this.logger.info(`[QUEUE] Event added: ${JSON.stringify(event)}`);
      this.queue.push({ ...event, toJSON: event.toJSON });
    }
  }

  async processEvents() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const batch = this.queue.splice(0, this.batchSize);
    try {
      await this.database.insertEvents(batch);
      this.logger.info(`[SUCCESS] Inserted ${batch.length} events`);
      batch.forEach((event: Event) => this.failedEvents.delete(event.id));
    } catch (error) {
      this.logger.error(`[ERROR] Batch insert failed:`, error);
      batch.forEach(event =>
        this.retryOrStoreFailedEvent(event, error.message),
      );
    }

    this.processing = false;
  }

  async retryOrStoreFailedEvent(event: Event, errorMessage: string) {
    const retries = this.failedEvents.get(event.id) || 0;
    if (retries >= this.maxRetries) {
      this.logger.error(
        `[DROPPED] Event permanently failed, storing in DB: ${JSON.stringify(
          event.toJSON(),
        )}`,
      );
      await this.storeFailedEvent(event, errorMessage);
      return;
    }

    this.failedEvents.set(event.id, retries + 1);
    this.queue.push(event);
    this.logger.warn(
      `[RETRY] Event re-added to queue (Attempt ${
        retries + 1
      }): ${JSON.stringify(event.toJSON())})`,
    );
  }

  async storeFailedEvent(event: Event, errorMessage: string) {
    try {
      await this.database.insertFailedEvent(
        JSON.stringify(event),
        errorMessage,
        this.maxRetries,
      );
      this.logger.warn(`[FAILED-LOGGED] Event stored in DB:`, event.toJSON());
    } catch (err) {
      this.logger.error(`[DB-ERROR] Failed to store event in DB:`, err);
    }
  }

  logQueueStats() {
    if (this.debug)
      this.logger.info(
        `[STATS] Queue Size: ${this.queue.length}, Failed Events: ${this.failedEvents.size}`,
      );
  }
}
