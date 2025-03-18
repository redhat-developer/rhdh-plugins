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
import { Knex } from 'knex';
import { Filters, EventDatabase, UserConfig } from '../event-database';
import { Event } from '../../models/Event';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  DailyUser,
  Grouping,
  ResponseData,
  ResponseWithGrouping,
} from '../../types/event';
import { convertToLocalTimezone } from '../../utils/date';

export abstract class BaseDatabaseAdapter implements EventDatabase {
  protected db: Knex;
  private readonly logger: LoggerService;
  protected filters?: Filters;
  protected config?: UserConfig;

  constructor(db: Knex, logger: LoggerService) {
    this.db = db;
    this.logger = logger;
  }

  setFilters(filters: Filters) {
    this.filters = filters;
    return this;
  }
  setConfig(config: UserConfig) {
    this.config = config;
    return this;
  }

  async insertFailedEvent(
    event: string,
    errorMessage: string,
    retryAttempts = 0,
  ) {
    const db = this.db;
    try {
      await db('failed_events').insert({
        event_data: event,
        error_message: errorMessage,
        retry_attempts: retryAttempts,
        created_at: new Date().toISOString(),
      });

      this.logger.info(`[DB] Failed event logged: ${event}`);
    } catch (error) {
      this.logger.error(`[DB] Error inserting failed event:`, error);
    }
  }

  async insertEvents(events: Event[]): Promise<void> {
    try {
      await this.db.transaction(async trx => {
        const evts = events.map(event => event.toJSON());
        await trx('events').insert(evts); // Bulk insert into events table ('events')
      });
      this.logger.info(
        `[DB] Successfully inserted ${events.length} events in bulk`,
      );
    } catch (error) {
      this.logger.error(`[DB] Error inserting batch:`, error);
      throw error; // Re-throw the error for retry handling
    }
  }

  protected selectFromEvents(
    queryBuilder: Knex.QueryBuilder,
    columns: (string | Knex.Raw<any>)[],
    dateRange?: [string, string],
  ): Knex.QueryBuilder {
    const query = queryBuilder
      .select(columns)
      .from('events')
      .andWhere('action', 'navigate');

    if (dateRange) {
      query.whereBetween('created_at', dateRange);
    }

    return query;
  }

  async getDailyUsers(): Promise<Knex.QueryBuilder> {
    this.ensureFiltersSet();
    const { start_date, end_date } = this.filters!;
    const db = this.db;

    const groupedEventsQuery = db('events')
      .select(db.raw(this.getDynamicDateGrouping()), 'user_ref')
      .whereBetween('created_at', [start_date, end_date])
      .groupByRaw('date, user_ref');

    const firstSeenQuery = db('events')
      .select('user_ref')
      .min('created_at as first_seen')
      .groupBy('user_ref');

    const query = db
      .from(db.raw('(?) as ge', [groupedEventsQuery]))
      .leftJoin(
        db.raw('(?) as fs', [firstSeenQuery]),
        'ge.user_ref',
        'fs.user_ref',
      )
      .select(
        'ge.date',
        db.raw('CAST(COUNT(*) as INTEGER) as total_users'),
        db.raw(
          `CAST(SUM(CASE WHEN fs.first_seen >= ${this.getFormatedDate(
            'ge.date',
          )} THEN 1 ELSE 0 END) as INTEGER) as new_users`,
        ),
        db.raw(
          `CAST(SUM(CASE WHEN fs.first_seen < ${this.getFormatedDate(
            'ge.date',
          )} THEN 1 ELSE 0 END) as INTEGER) as returning_users`,
        ),
      )
      .groupBy('ge.date')
      .orderBy('ge.date');

    return query.then(data => this.getResponseWithGrouping<DailyUser[]>(data));
  }

  async getUsers(): Promise<Knex.QueryBuilder> {
    this.ensureFiltersSet();
    const { start_date, end_date } = this.filters!;
    const db = this.db;
    const query = db('events')
      .select(db.raw('CAST(COUNT(*) as INTEGER) as logged_in_users'))
      .from(
        db('events')
          .select('user_ref')
          .whereBetween('created_at', [start_date, end_date])
          .groupBy('user_ref'),
      )
      .as('sub');

    return query.then(result => {
      const { licensedUsers } = this.config!;
      result[0] = { ...result[0], licensed_users: licensedUsers } as any;
      return this.getResponseData(result);
    });
  }

  async getTopTemplateViews(): Promise<Knex.QueryBuilder> {
    this.ensureFiltersSet();
    const { start_date, end_date, limit } = this.filters!;
    const db = this.db;
    const query = db('events')
      .select(
        db.raw(`context->>'entityRef' AS entityref`),
        db.raw('CAST(COUNT(*) as INTEGER) AS count'),
        db.raw(this.getLastUsedDate()),
      )
      .where({
        action: 'click',
        subject: 'Create',
        plugin_id: 'scaffolder',
      })
      .whereBetween('created_at', [start_date, end_date])
      .groupByRaw('entityref')
      .orderBy('count', 'desc')
      .limit(Number(limit) || 3);

    return query.then(data => this.getResponseData(data, 'last_used'));
  }

  async getTopSearches(): Promise<Knex.QueryBuilder> {
    const db = this.db;
    this.ensureFiltersSet();
    const { start_date, end_date, limit } = this.filters!;
    const query = db('events')
      .select(
        db.raw(this.getDynamicDateGrouping()),
        db.raw('CAST(COUNT(*) as INTEGER) AS count'),
      )
      .whereBetween('created_at', [start_date, end_date])
      .andWhere('action', 'search')
      .groupByRaw('date')
      .orderBy('date', 'asc')
      .limit(Number(limit) || 3);

    return query.then(data => this.getResponseWithGrouping(data));
  }

  async getTopTechDocsViews(): Promise<Knex.QueryBuilder> {
    this.ensureFiltersSet();
    const { start_date, end_date, limit } = this.filters!;
    const db = this.db;
    const query = db('events')
      .select(
        db.raw('CAST(COUNT(*) as INTEGER) AS count'),
        db.raw(this.getLastUsedDate()),
        db.raw(`COALESCE(attributes->>'kind', '') AS kind`),
        db.raw(`COALESCE(attributes->>'name', '') AS name`),
        db.raw(`COALESCE(attributes->>'namespace', '') AS namespace`),
      )
      .where({
        action: 'navigate',
        plugin_id: 'techdocs',
      })
      .whereBetween('created_at', [start_date, end_date])
      .groupByRaw(`name, kind, namespace`)
      .limit(Number(limit) || 3);

    return query.then(data => this.getResponseData(data, 'last_used'));
  }

  async getTopCatalogEntitiesViews(): Promise<Knex.QueryBuilder> {
    this.ensureFiltersSet();
    const { start_date, end_date, limit, kind } = this.filters!;
    const db = this.db;
    const query = db('events')
      .select(
        'plugin_id',
        db.raw(`attributes->>'kind' AS kind`),
        db.raw(`attributes->>'name' AS name`),
        db.raw(`attributes->>'namespace' AS namespace`),
        db.raw(this.getLastUsedDate()),
        db.raw('CAST(COUNT(*) as INTEGER) AS count'),
      )
      .whereBetween('created_at', [start_date, end_date])
      .andWhere(db.raw(`attributes->>'kind' IS NOT NULL`))
      .andWhere('action', 'navigate')
      .andWhere('plugin_id', 'catalog')
      .groupByRaw('plugin_id, kind, name, namespace')
      .orderBy('count', 'desc')
      .limit(Number(limit) || 3);

    if (kind) {
      query.andWhere(db.raw(`attributes->>'kind' = ?`, [kind]));
    }
    return query.then(data => this.getResponseData(data, 'last_used'));
  }

  async getTopPluginViews(): Promise<Knex.QueryBuilder> {
    this.ensureFiltersSet();
    const { start_date, end_date, limit = 3 } = this.filters!;
    const dateRange: [string, string] = [start_date, end_date];
    const db = this.db;

    // return grouped plugin counts by date.
    const getTrendDataQuery = (qb: Knex.QueryBuilder) => {
      const trend_data_columns = [
        'plugin_id',
        db.raw(this.getDynamicDateGrouping()),
        db.raw('CAST(COUNT(*) as INTEGER) AS count'),
      ];

      return this.selectFromEvents(qb, trend_data_columns, dateRange).groupBy(
        'plugin_id',
        'date',
      );
    };

    // return grouped plugin counts
    const getPluginCountsQuery = (qb: Knex.QueryBuilder) => {
      const plugin_counts_columns = [
        'plugin_id',
        db.raw('CAST(COUNT(*) as INTEGER) AS visit_count'),
      ];
      return this.selectFromEvents(
        qb,
        plugin_counts_columns,
        dateRange,
      ).groupBy('plugin_id');
    };

    // return aggregated trends JSON object and first_count, last_count to calculate the trend percentage
    const getAggregatedTrendsQuery = (qb: Knex.QueryBuilder) => {
      return qb
        .select([
          'plugin_id',
          db.raw(`
                json(${this.getJsonAggregationQuery('date', 'count')}) AS trend,
                COALESCE((SELECT count FROM trend_data td WHERE td.plugin_id = t.plugin_id ORDER BY date LIMIT 1),0) AS first_count,
                COALESCE((SELECT count FROM trend_data td WHERE td.plugin_id = t.plugin_id ORDER BY date DESC LIMIT 1),0) AS last_count
                `),
        ])
        .from('trend_data AS t')
        .groupBy('plugin_id');
    };

    // Main query to get top plugins counts, trends for the given date range.
    const query = db
      .with('trend_data', qb => getTrendDataQuery(qb))
      .with('plugin_counts', qb => getPluginCountsQuery(qb))
      .with('aggregated_trends', qb => getAggregatedTrendsQuery(qb))
      .select([
        'p.plugin_id',
        'p.visit_count',
        't.trend',
        db.raw(`
            CASE
            WHEN t.first_count = 0 THEN NULL
            ELSE ROUND(((t.last_count - t.first_count) * 100.0) / NULLIF(t.first_count, 0), 2)
            END AS trend_percentage
        `),
      ])
      .from('plugin_counts AS p')
      .leftJoin('aggregated_trends AS t', 'p.plugin_id', 't.plugin_id')
      .orderBy('p.visit_count', 'desc')
      .limit(limit);

    return query.then(data => {
      return this.getResponseWithGrouping(
        this.transformJson(data, 'trend'),
        'trend',
      );
    });
  }

  abstract getDate(): string;
  abstract getLastUsedDate(): string;
  abstract isJsonSupported(): boolean;
  abstract isPartitionSupported(): boolean;
  abstract getDateBetweenQuery(): string;
  abstract getDynamicDateGrouping(onlyText?: boolean): Grouping | string;
  abstract getFormatedDate(column: string): string;
  abstract getJsonAggregationQuery(...args: any[]): string;

  // Helper methods
  transformDateRange(dateRange: [string, string]): [string, string] {
    return dateRange;
  }

  transformJson(data: any[], jsonField: string): any {
    return data.map((row: any) => ({
      ...row,
      [jsonField]: row[jsonField]
        ? JSON.parse(JSON.stringify(row[jsonField]))
        : null,
    }));
  }

  modifyDateInObject<T extends any>(
    obj: T & { [key: string]: string | number },
    datePath: string = 'date',
  ) {
    if (obj[datePath]) {
      return {
        ...obj,
        [datePath]: convertToLocalTimezone(obj[datePath] as string),
      };
    }
    return obj;
  }

  getResponseData<T extends any[]>(
    data: T,
    datePath: string = 'date',
  ): ResponseData<T> {
    return {
      data: data.map(d => {
        if (Array.isArray(d[datePath])) {
          return {
            ...d,
            [datePath]: d[datePath].map((dp: any) =>
              this.modifyDateInObject(dp),
            ),
          };
        }
        return this.modifyDateInObject(d, datePath);
      }) as T,
    };
  }

  getResponseWithGrouping = <T extends any[]>(
    data: T,
    datePath: string = 'date',
  ): ResponseWithGrouping<T> => {
    const grouping = this.getDynamicDateGrouping(true) as Grouping;

    if (grouping === 'hourly') {
      return {
        grouping,
        data: data.map(d => {
          if (Array.isArray(d[datePath])) {
            return {
              ...d,
              [datePath]: d[datePath].map((dp: any) =>
                this.modifyDateInObject(dp),
              ),
            };
          }
          return this.modifyDateInObject(d, datePath);
        }) as T,
      };
    }

    return {
      grouping,
      data,
    };
  };

  ensureFiltersSet() {
    if (!this.filters) {
      throw new Error(
        'Filters must be set using setFilters() before calling methods.',
      );
    }
  }
}
