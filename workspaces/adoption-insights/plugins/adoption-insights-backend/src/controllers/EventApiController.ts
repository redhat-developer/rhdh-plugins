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
import { json2csv as Parser } from 'json-2-csv';
import { Knex } from 'knex';
import { AnalyticsEvent } from '@backstage/core-plugin-api';
import { EventDatabase, Filters } from '../database/event-database';
import { EventBatchProcessor } from '../domain/EventBatchProcessor';
import { Event } from '../models/Event';
import { QueryParams, QueryType } from '../types/event-request';
import { toEndOfDayUTC, toStartOfDayUTC } from '../utils/date';
import { EventSchema } from '../validation/event';
import { EventRequestSchema } from '../validation/event-request';
import { ValidationError } from '../validation/ValidationError';
import { RootConfigService } from '@backstage/backend-plugin-api/index';
import { getLicensedUsersCount } from '../utils/config';

class EventApiController {
  private readonly database: EventDatabase;
  private readonly config: RootConfigService;
  private readonly processor: EventBatchProcessor;

  constructor(
    eventDatabase: EventDatabase,
    processor: EventBatchProcessor,
    config: RootConfigService,
  ) {
    this.database = eventDatabase;
    this.processor = processor;
    this.config = config;
  }

  private processIncomingEvents(events: AnalyticsEvent[]): void {
    const proccessedEvents = events
      .filter(e => !!e.context?.userId)
      .map(event => new Event(event, this.database.isJsonSupported()));

    proccessedEvents.forEach(event => {
      const result = EventSchema.safeParse(event);

      if (!result.success) {
        throw new ValidationError('Invalid event data', result.error.flatten());
      }

      return this.processor.addEvent(event);
    });
  }

  trackEvents(req: Request<{}, {}, AnalyticsEvent[]>, res: Response): void {
    const events = req.body;

    try {
      this.processIncomingEvents(events);
      res.status(200).json({ success: true, message: 'Event received' });
    } catch (error) {
      res
        .status(400)
        .json({ message: error.message, errors: error.details.fieldErrors });
    }
  }

  // Get insights based on the type of data requested
  async getInsights(
    req: Request<{}, {}, {}, QueryParams>,
    res: Response,
  ): Promise<void> {
    const parsed = EventRequestSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Invalid query',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const { type, format, ...params } = parsed.data;
    const licensedUsers = getLicensedUsersCount(this.config);
    const filters: Filters = {
      ...params,
      end_date: toEndOfDayUTC(params.end_date) as string,
      start_date: toStartOfDayUTC(params.start_date) as string,
    };
    const db = this.database;

    db.setFilters(filters);
    db.setConfig({ licensedUsers });
    const queryHandlers: Record<QueryType, () => Promise<Knex.QueryBuilder>> = {
      total_users: () => db.getUsers(),
      active_users: () => db.getDailyUsers(),
      top_searches: () => db.getTopSearches(),
      top_plugins: () => db.getTopPluginViews(),
      top_techdocs: () => db.getTopTechDocsViews(),
      top_templates: () => db.getTopTemplateViews(),
      top_catalog_entities: () => db.getTopCatalogEntitiesViews(),
    };

    try {
      const result = await queryHandlers[type as QueryType]();
      if (format === 'csv' && result.data) {
        const csv = Parser(result.data);
        res.header('Content-Type', 'text/csv');
        res.attachment(`adoption_insights_${type}.csv`);
        res.send(csv);
        return;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  }
}

export default EventApiController;
