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
import { CatalogService } from '@backstage/plugin-catalog-node';
import { Duration } from 'luxon';
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
  AuthService,
  BackstageCredentials,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { getLicensedUsersCount, getMaxEventsPerRequest } from '../utils/config';
import {
  TechDocsCount,
  TimeSavedTotals,
  TopTechDocsCount,
} from '../types/event';
import {
  buildTechDocsMetadataUrl,
  isSafeTechDocsEntitySegment,
  TechDocsEntityParts,
} from '../utils/techdocsMetadata';

function readTechDocsSiteName(payload: unknown): string | undefined {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('site_name' in payload)
  ) {
    return undefined;
  }
  const siteName = (payload as { site_name: unknown }).site_name;
  return typeof siteName === 'string' ? siteName : undefined;
}

class EventApiController {
  // Upper bound on simultaneous catalog lookups when resolving template
  // time-saved estimates for a single incoming batch.
  private static readonly MAX_CATALOG_LOOKUP_CONCURRENCY = 5;

  private readonly database: EventDatabase;
  private readonly config: RootConfigService;
  private readonly processor: EventBatchProcessor;
  private readonly auditor: AuditorService;
  private readonly auth: AuthService;
  private readonly httpAuth: HttpAuthService;
  private readonly discovery: DiscoveryService;
  private readonly catalog: CatalogService;
  private readonly logger: LoggerService;

  constructor(
    eventDatabase: EventDatabase,
    processor: EventBatchProcessor,
    config: RootConfigService,
    auditor: AuditorService,
    auth: AuthService,
    httpAuth: HttpAuthService,
    discovery: DiscoveryService,
    catalog: CatalogService,
    logger: LoggerService,
  ) {
    this.database = eventDatabase;
    this.processor = processor;
    this.config = config;
    this.auditor = auditor;
    this.auth = auth;
    this.httpAuth = httpAuth;
    this.discovery = discovery;
    this.catalog = catalog;
    this.logger = logger;
  }

  private isScaffolderCreateEvent(event: AnalyticsEvent): boolean {
    return (
      event.action === 'create' &&
      event.subject === 'Task has been created' &&
      event.context?.pluginId === 'scaffolder'
    );
  }

  private async getTimeSavedMinutes(
    entityRef: string,
    credentials: BackstageCredentials,
  ): Promise<number | undefined> {
    try {
      const entity = await this.catalog.getEntityByRef(entityRef, {
        credentials,
      });
      const annotation =
        entity?.kind.toLowerCase() === 'template'
          ? entity.metadata.annotations?.['backstage.io/time-saved']
          : undefined;
      if (!annotation) {
        this.logger.debug('Template has no time-saved estimate', { entityRef });
        return undefined;
      }

      const minutes = Duration.fromISO(annotation).as('minutes');
      if (!Number.isFinite(minutes) || minutes < 0) {
        this.logger.warn('Template has an invalid time-saved estimate', {
          entityRef,
        });
        return undefined;
      }

      this.logger.debug('Resolved template time-saved estimate', { entityRef });
      return minutes;
    } catch (error) {
      this.logger.warn('Failed to resolve template time-saved estimate', {
        entityRef,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  /**
   * Resolves each distinct template ref to its time-saved estimate once, while
   * bounding how many catalog lookups run at the same time.
   */
  private async resolveTimeSavedByRef(
    entityRefs: string[],
    credentials: BackstageCredentials,
  ): Promise<Map<string, number | undefined>> {
    const timeSavedByRef = new Map<string, number | undefined>();
    const concurrency = EventApiController.MAX_CATALOG_LOOKUP_CONCURRENCY;

    for (let i = 0; i < entityRefs.length; i += concurrency) {
      const chunk = entityRefs.slice(i, i + concurrency);
      const minutes = await Promise.all(
        chunk.map(ref => this.getTimeSavedMinutes(ref, credentials)),
      );
      chunk.forEach((ref, index) => timeSavedByRef.set(ref, minutes[index]));
    }

    return timeSavedByRef;
  }

  private collectScaffolderEntityRefs(events: AnalyticsEvent[]): string[] {
    const entityRefs = new Set<string>();
    for (const event of events) {
      const entityRef = event.context?.entityRef;
      if (
        this.isScaffolderCreateEvent(event) &&
        typeof entityRef === 'string' &&
        entityRef
      ) {
        entityRefs.add(entityRef);
      }
    }
    return [...entityRefs];
  }

  private async processIncomingEvents(
    events: AnalyticsEvent[],
    auditEvent: AuditorServiceEvent,
    userRef: string,
    credentials: BackstageCredentials,
  ): Promise<void> {
    const maxEventsPerRequest = getMaxEventsPerRequest(this.config);
    if (!Array.isArray(events) || events.length > maxEventsPerRequest) {
      const error = new ValidationError('Invalid event data', {
        fieldErrors: {
          events: [
            `A maximum of ${maxEventsPerRequest} events may be submitted per request`,
          ],
        },
      });
      auditEvent.fail({ error });
      throw error;
    }

    // Only events carrying a user id are persisted.
    const candidateEvents = events.filter(e => !!e.context?.userId);

    // Validate every event before performing any catalog lookups so that
    // rejected batches never trigger enrichment requests.
    for (const event of candidateEvents) {
      const candidate = new Event(
        { ...event, context: { ...event.context, userName: userRef } },
        this.database.isJsonSupported(),
      );
      const result = EventSchema.safeParse(candidate);
      if (!result.success) {
        auditEvent.fail({
          error: new Error(JSON.stringify(result.error.flatten())),
        });
        throw new ValidationError('Invalid event data', result.error.flatten());
      }
    }

    const timeSavedByRef = await this.resolveTimeSavedByRef(
      this.collectScaffolderEntityRefs(candidateEvents),
      credentials,
    );

    // Enrich the validated events from the lookup table and persist them.
    for (const event of candidateEvents) {
      let value = event.value;
      if (this.isScaffolderCreateEvent(event)) {
        const entityRef = event.context?.entityRef;
        if (typeof entityRef === 'string' && entityRef) {
          value = timeSavedByRef.get(entityRef);
        } else {
          this.logger.warn(
            'Scaffolder create event has no template entity ref',
          );
          value = undefined;
        }
      }

      const processedEvent = new Event(
        {
          ...event,
          value,
          context: { ...event.context, userName: userRef },
        },
        this.database.isJsonSupported(),
      );
      auditEvent.success({ meta: { eventId: processedEvent.id } });
      this.processor.addEvent(processedEvent);
    }
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
      const credentials = await this.httpAuth.credentials(req, {
        allow: ['user'],
      });
      await this.processIncomingEvents(
        events,
        auditEvent,
        credentials.principal.userEntityRef,
        credentials,
      );
      res.status(200).json({ success: true, message: 'Event received' });
    } catch (error) {
      auditEvent.fail({
        error: error instanceof Error ? error : new Error(String(error)),
      });
      if (error instanceof ValidationError) {
        res.status(400).json({
          message: error.message,
          errors: error.details.fieldErrors,
        });
        return;
      }
      throw error;
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
    const queryHandlers: Record<
      QueryType,
      () => Promise<Knex.QueryBuilder | TimeSavedTotals>
    > = {
      total_users: () => db.getUsers(),
      active_users: () => db.getDailyUsers(),
      top_searches: () => db.getTopSearches(),
      top_plugins: () => db.getTopPluginViews(),
      top_techdocs: () => db.getTopTechDocsViews(),
      top_templates: () => db.getTopTemplates(),
      time_saved: () => db.getTimeSaved(),
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
    const rowsToFetch: { row: TechDocsCount; parts: TechDocsEntityParts }[] =
      [];

    for (const row of result.data) {
      if (!row.namespace || !row.kind || !row.name) {
        row.site_name = '';
        continue;
      }

      const parts: TechDocsEntityParts = {
        namespace: row.namespace,
        kind: row.kind,
        name: row.name,
      };
      if (
        !isSafeTechDocsEntitySegment(parts.namespace) ||
        !isSafeTechDocsEntitySegment(parts.kind) ||
        !isSafeTechDocsEntitySegment(parts.name)
      ) {
        this.logger.warn(
          'Skipping TechDocs metadata fetch for unsafe entity path',
          {
            namespace: parts.namespace,
            kind: parts.kind,
            name: parts.name,
          },
        );
        row.site_name = row.name;
        continue;
      }

      rowsToFetch.push({ row, parts });
    }

    if (rowsToFetch.length === 0) {
      return;
    }

    let baseUrl: string;
    let token: string;
    try {
      baseUrl = await this.discovery.getBaseUrl('techdocs');
      const credentials = await this.httpAuth.credentials(req, {
        allow: ['user'],
      });
      ({ token } = await this.auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'techdocs',
      }));
    } catch (error) {
      this.logger.warn(
        'Failed to prepare TechDocs metadata lookup; falling back to entity names',
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
      for (const { row } of rowsToFetch) {
        row.site_name = row.name;
      }
      return;
    }

    const fetchTargets: { row: TechDocsCount; url: string }[] = [];
    for (const { row, parts } of rowsToFetch) {
      const url = buildTechDocsMetadataUrl(baseUrl, parts);
      if (!url) {
        this.logger.warn(
          'Skipping TechDocs metadata fetch for unsafe entity path',
          {
            namespace: parts.namespace,
            kind: parts.kind,
            name: parts.name,
          },
        );
        row.site_name = row.name;
        continue;
      }
      fetchTargets.push({ row, url });
    }

    await Promise.all(
      fetchTargets.map(({ row, url }) =>
        fetch(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
          .then(async response => {
            if (!response.ok) {
              if (response.status === 404) {
                this.logger.debug(
                  'TechDocs metadata not found; falling back to entity name',
                  {
                    kind: row.kind,
                    name: row.name,
                    namespace: row.namespace,
                    status: response.status,
                  },
                );
              } else {
                this.logger.warn(
                  'TechDocs metadata request failed; falling back to entity name',
                  {
                    kind: row.kind,
                    name: row.name,
                    namespace: row.namespace,
                    status: response.status,
                  },
                );
              }
              row.site_name = row.name;
              return;
            }
            const data: unknown = await response.json();
            row.site_name = readTechDocsSiteName(data) ?? row.name;
          })
          .catch(error => {
            this.logger.warn('Failed to fetch TechDocs metadata', {
              kind: row.kind,
              name: row.name,
              namespace: row.namespace,
              error: error instanceof Error ? error.message : String(error),
            });
            row.site_name = row.name;
          }),
      ),
    );
  }
}

export default EventApiController;
