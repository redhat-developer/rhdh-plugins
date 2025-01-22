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
import { AuthService } from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';
import {
  AggregationsRequest,
  MarketplaceApi,
  MarketplaceKinds,
  MarketplacePlugin,
  MarketplacePluginList,
} from '../types';

/**
 * @public
 */
export type MarketplaceCatalogClientOptions = {
  auth?: AuthService;
  catalogApi: CatalogApi;
  client: Knex;
};

/**
 * @public
 */
export class MarketplaceCatalogClient implements MarketplaceApi {
  private readonly catalog: CatalogApi;
  private readonly auth?: AuthService;
  private readonly client?: Knex;

  constructor(options: MarketplaceCatalogClientOptions) {
    this.auth = options.auth;
    this.catalog = options.catalogApi;
    this.client = options.client;
  }

  private async getServiceToken(): Promise<{ token: string } | undefined> {
    if (!this.auth) {
      return undefined;
    }
    return await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
  }

  async getPlugins(): Promise<MarketplacePlugin[]> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      {
        filter: {
          kind: 'plugin',
        },
      },
      token,
    );

    return result.items as MarketplacePlugin[];
  }

  async getPluginLists(): Promise<MarketplacePluginList[]> {
    const token = await this.getServiceToken();
    const result = await this.catalog.queryEntities(
      {
        filter: {
          kind: 'pluginList',
        },
      },
      token,
    );

    return result.items as MarketplacePluginList[];
  }

  async getPluginListByName(name: string): Promise<MarketplacePluginList> {
    const token = await this.getServiceToken();
    const result = await this.catalog.getEntityByRef(
      stringifyEntityRef({
        name,
        kind: MarketplaceKinds.pluginList,
      }),
      token,
    );

    return result as MarketplacePluginList;
  }

  async getPluginByName(name: string): Promise<MarketplacePlugin> {
    const token = await this.getServiceToken();
    const result = await this.catalog.getEntityByRef(
      stringifyEntityRef({
        name,
        kind: MarketplaceKinds.plugin,
      }),
      token,
    );

    return result as MarketplacePlugin;
  }

  async getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]> {
    const pluginList = await this.getPluginListByName(name);
    const plugins = pluginList?.spec?.plugins;

    if (!pluginList) {
      throw new NotFoundError(
        `${MarketplaceKinds.pluginList}:${name} not found`,
      );
    }

    if (!plugins) {
      return [] as MarketplacePlugin[];
    }

    const token = await this.getServiceToken();

    const entityRefs = plugins.map(plugin =>
      stringifyEntityRef({
        kind: MarketplaceKinds.plugin,
        namespace: pluginList.metadata!.namespace,
        name: plugin,
      }),
    );

    const result = await this.catalog.getEntitiesByRefs({ entityRefs }, token);
    return result.items.filter(i => !!i) as MarketplacePlugin[];
  }

  /**
   *
   * Fetches aggregate data based on the provided aggregations request and an optional base query.
   *
   * This function is designed to handle aggregation queries against a database, utilizing the provided
   * `aggregationsRequest` to define aggregation operations and an optional `baseQuery` as the starting
   * query builder. If `baseQuery` is not provided, a new query builder is created.
   *
   * @param aggregationsRequest - An object containing the aggregation operations and parameters.
   *   It typically includes  name, field, filters, havingFilters, orderFields and aggregation operations like sum, count, min, max, avg etc.
   *   Example structure of `AggregationsRequest`:
   * ```
   *   [{
   *     type: 'count'
   *     field: 'spec.category.id',
   *     value: 'kubernetes', // Optional
   *     name: 'label', // Optional
   *     filter: { kind: 'plugin' }, // Optional
   *     orderFields: [{field: 'count', order: 'asc'}], // Optional
   *     havingFilter: [ // Optional
   *       { field: 'count', operator: '>', value: '1' },
   *     ]
   *   }]
   * ```
   * @param baseQuery - Optional `baseQuery` as the starting
   *        query builder. If `baseQuery` is not provided, a new query builder is created.
   * @returns A `Promise` that resovles to a Knex QueryBuilder instance.
   */
  async getAggregateData(
    aggregationsRequest: AggregationsRequest,
    baseQuery: Knex.QueryBuilder | null = null,
  ): Promise<Knex.QueryBuilder> {
    if (!this.client) {
      throw new Error(
        'Database client is not configured. Please check the MarketplaceCatalogClient configuration.',
      );
    }
    const dbClient = this.client;
    const query =
      baseQuery ||
      dbClient('final_entities as fe').whereNotNull('fe.final_entity');
    aggregationsRequest.forEach((agg, index) => {
      const currentAlias = `s${index + 1}`;

      // Add LEFT JOIN for each aggregation
      query.leftJoin(
        `search as ${currentAlias}`,
        'fe.entity_id',
        `${currentAlias}.entity_id`,
      );

      const getLastValue = (input: string): string => {
        if (!input.includes('.')) {
          return input;
        }

        const parts = input.split('.');
        return parts[parts.length - 1];
      };

      const fieldName = getLastValue(agg.name ?? agg.field);

      // Add SELECT clause
      if (agg.type === 'count') {
        query.select(`${currentAlias}.value as ${fieldName}`);
      }

      // Apply aggregate functions
      if (agg.type) {
        if (agg.type === 'count') {
          query.count('* as count');
        } else if (['avg', 'sum'].includes(agg.type)) {
          query
            .select(
              dbClient.raw(
                `${agg.type.toLocaleUpperCase('en-US')}(CAST(${currentAlias}.value AS NUMERIC)) AS ${agg.type}`,
              ),
            )
            .andWhereRaw(`${currentAlias}.value ~ ?`, ['^[0-9]+(\\.[0-9]+)?$']);
        } else {
          query.select(
            dbClient.raw(
              `${agg.type.toLocaleUpperCase('en-US')}(${currentAlias}.value) AS ${fieldName}`,
            ),
          );
        }
      }

      // Apply WHERE filters
      query.where(`${currentAlias}.key`, agg.field);
      if (agg.value)
        query.where(
          `${currentAlias}.value`,
          agg.value.toLocaleLowerCase('en-US'),
        );

      // Apply additional filters
      if (agg.filter) {
        Object.entries(agg.filter).forEach(([key, value], idx) => {
          const filterAlias = `f${idx + 1}`;
          query
            .leftJoin(
              `search as ${filterAlias}`,
              'fe.entity_id',
              `${filterAlias}.entity_id`,
            )
            .where(`${filterAlias}.key`, key)
            .where(`${filterAlias}.value`, value.toLocaleLowerCase('en-US'));
        });
      }

      // Add GROUP BY clause for count
      if (agg.type === 'count') {
        query.groupBy(`${currentAlias}.key`, `${currentAlias}.value`);
      }

      // Apply HAVING filters
      if (agg.havingFilter) {
        const { field, operator, value } = agg.havingFilter;
        const rawField = field === 'count' ? dbClient.raw('COUNT(*)') : field;
        query.having(rawField, operator, value);
      }

      // Apply ORDER BY clause
      if (agg.orderFields) {
        const getOrderByField = (field: 'value' | 'count'): string => {
          const fieldMappings: Record<string, string> = {
            value: `${currentAlias}.value`,
            count: 'count',
          };
          return fieldMappings[field] || `${currentAlias}.value`;
        };

        agg.orderFields.forEach(({ field, order }) => {
          query.orderBy(getOrderByField(field), order);
        });
      }
    });

    return query;
  }
}
