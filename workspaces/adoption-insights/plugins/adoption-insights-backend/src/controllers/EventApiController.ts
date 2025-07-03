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
import {
  AuditorService,
  AuditorServiceEvent,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { getLicensedUsersCount } from '../utils/config';
import { TechDocsCount, TopTechDocsCount } from '../types/event';

class EventApiController {
  private readonly database: EventDatabase;
  private readonly config: RootConfigService;
  private readonly processor: EventBatchProcessor;
  private readonly auditor: AuditorService;

  constructor(
    eventDatabase: EventDatabase,
    processor: EventBatchProcessor,
    config: RootConfigService,
    auditor: AuditorService,
  ) {
    this.database = eventDatabase;
    this.processor = processor;
    this.config = config;
    this.auditor = auditor;
  }

  async getBaseUrl(pluginId: string): Promise<string> {
    return `${this.config.getString('backend.baseUrl')}/api/${pluginId}`;
  }

  private processIncomingEvents(
    events: AnalyticsEvent[],
    auditEvent: AuditorServiceEvent,
  ): void {
    const proccessedEvents = events
      .filter(e => !!e.context?.userId)
      .map(event => new Event(event, this.database.isJsonSupported()));

    proccessedEvents.forEach(event => {
      const result = EventSchema.safeParse(event);

      if (!result.success) {
        auditEvent.fail({
          error: new Error(JSON.stringify(result.error.flatten())),
        });
        throw new ValidationError('Invalid event data', result.error.flatten());
      }
      auditEvent.success({ meta: { eventId: event.id } });
      return this.processor.addEvent(event);
    });
  }

  async trackEvents(
    req: Request<{}, {}, AnalyticsEvent[]>,
    res: Response,
  ): Promise<void> {
    const events = req.body;

    const auditEvent = await this.auditor.createEvent({
      eventId: 'capture-event',
      request: req,
    });

    try {
      this.processIncomingEvents(events, auditEvent);
      res.status(200).json({ success: true, message: 'Event received' });
    } catch (error) {
      auditEvent.fail({
        error: error instanceof Error ? error : new Error(String(error)),
      });
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
    const auditEvent = await this.auditor.createEvent({
      eventId: 'get-insights',
      request: req,
    });

    const parsed = EventRequestSchema.safeParse(req.query);
    if (!parsed.success) {
      auditEvent.fail({
        error: new Error(
          JSON.stringify({
            message: 'Invalid query',
            errors: parsed.error.flatten().fieldErrors,
          }),
        ),
      });
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
      end_date: toEndOfDayUTC(params.end_date, params.timezone) as string,
      start_date: toStartOfDayUTC(params.start_date, params.timezone) as string,
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

      if (type === 'top_techdocs') {
        await this.getTechdocsMetadata(req, result);
      }

      auditEvent.success({
        meta: {
          queryType: type,
          format: format,
          resultsCount: result.data?.length || 0,
        },
      });

      if (format === 'csv' && result.data) {
        const csv = Parser(result.data);
        res.header('Content-Type', 'text/csv');
        res.attachment(`adoption_insights_${type}.csv`);
        res.send(csv);
        return;
      }
      res.json(result);
    } catch (error) {
      auditEvent.fail({
        error: error instanceof Error ? error : new Error(String(error)),
      });
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  }

  async getTechdocsMetadata(
    req: Request<{}, {}, {}, QueryParams>,
    result: TopTechDocsCount,
  ) {
    const promises: Promise<void>[] = [];
    const baseUrl = await this.getBaseUrl('techdocs');

    result.data.forEach((row: TechDocsCount) => {
      if (!row.namespace || !row.kind || !row.name) {
        row.site_name = '';
      } else {
        promises.push(
          fetch(
            `${baseUrl}/metadata/techdocs/${row.namespace}/${row.kind}/${row.name}`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: req.headers.authorization as string,
              },
            },
          )
            .then(async response => {
              const data = await response.json();
              row.site_name = data.site_name ?? row.name;
            })
            .catch(e => {
              console.warn(e);
              row.site_name = row.name;
            }),
        );
      }
    });

    await Promise.all(promises);
  }
}

export default EventApiController;
