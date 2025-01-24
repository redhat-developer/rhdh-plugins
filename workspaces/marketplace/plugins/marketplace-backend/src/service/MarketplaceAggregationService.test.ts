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
import {
  AggregationsRequest,
  MarketplaceAggregationApi,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { MarketplaceAggregationService } from './MarketplaceAggregationService';

const getMockQueryBuilder = () => ({
  whereNotNull: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  andWhereRaw: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  orHaving: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
});

describe('MarketplaceAggregationService', () => {
  let mockKnexClient: jest.MockedFunction<Knex>;
  let mockQueryBuilder: jest.Mocked<any>;
  let api: MarketplaceAggregationApi;
  beforeEach(() => {
    mockQueryBuilder = getMockQueryBuilder();

    mockKnexClient = jest.fn(() => ({
      ...mockQueryBuilder,
    })) as unknown as jest.MockedFunction<Knex>;

    const mockRaw = jest
      .fn()
      .mockImplementation((sql: string) => sql) as unknown as Knex.RawBuilder<
      any,
      any
    >;

    mockKnexClient.raw = mockRaw;
    api = new MarketplaceAggregationService({
      client: mockKnexClient,
    });
  });

  it('should throw error if the database client is not passed', async () => {
    const marketplaceaggregationApi = new MarketplaceAggregationService({
      client: undefined as any,
    });
    await expect(
      marketplaceaggregationApi.fetchAggregatedData([]),
    ).rejects.toThrow(
      'Database client is not configured. Please check the MarketplaceCatalogClient configuration.',
    );
  });

  it('should generate query for count aggregation', async () => {
    const aggregationsQuery: AggregationsRequest = [
      {
        field: 'category.id',
        type: 'count',
        orderFields: [{ field: 'value', order: 'desc' }],
      },
    ];

    await api.fetchAggregatedData(aggregationsQuery);

    expect(mockQueryBuilder.whereNotNull).toHaveBeenCalledWith(
      'fe.final_entity',
    );

    expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
      'search as s1',
      'fe.entity_id',
      's1.entity_id',
    );

    expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');

    expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('s1.key', 's1.value');

    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('s1.value', 'desc');
  });

  it('should handle aggregations with filters and having clauses', async () => {
    const aggregationsRequest: AggregationsRequest = [
      {
        type: 'sum',
        field: 'amount',
        name: 'total_amount',
        filter: { category: 'electronics' },
        havingFilters: [
          { field: 'total_amount', operator: '>', value: '1000' },
        ],
        orderFields: [{ field: 'value', order: 'asc' }],
      },
    ];

    await api.fetchAggregatedData(aggregationsRequest);

    expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
      'search as s1',
      'fe.entity_id',
      's1.entity_id',
    );
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('s1.key', 'amount');
    expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
      'search as f1',
      'fe.entity_id',
      'f1.entity_id',
    );
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('f1.key', 'category');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'f1.value',
      'electronics',
    );

    expect(mockQueryBuilder.select).toHaveBeenCalledWith(expect.anything());
    expect(mockQueryBuilder.having).toHaveBeenCalledWith(
      'total_amount',
      '>',
      '1000',
    );

    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('s1.value', 'asc');
  });

  it('should handle having clauses with count', async () => {
    const aggregationsRequest: AggregationsRequest = [
      {
        field: 'kind',
        type: 'count',
        havingFilters: [
          { field: 'count', operator: '>', value: '10' },
          {
            logicalOperator: 'OR',
            field: 'spec.installs',
            operator: '>',
            value: '5',
          },
        ],
      },
    ];

    await api.fetchAggregatedData(aggregationsRequest);
    expect(mockKnexClient).toHaveBeenCalledWith('final_entities as fe');
    expect(mockQueryBuilder.having).toHaveBeenCalledWith('COUNT(*)', '>', '10');
  });

  it('should use a custom base query if provided', async () => {
    const aggregationsRequest: AggregationsRequest = [
      { type: 'count', field: 'custom_field' },
    ];

    await api.fetchAggregatedData(aggregationsRequest);

    expect(mockKnexClient).toHaveBeenCalledWith('final_entities as fe');
    expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');
  });

  it('should handle orderFields', async () => {
    const aggregationsRequest: AggregationsRequest = [
      {
        field: 'kind',
        value: 'plugin',
        type: 'count',
        orderFields: [{ field: 'count', order: 'asc' }],
      },
      {
        field: 'label',
        type: 'min',
        orderFields: [{ field: 'value', order: 'desc' }],
      },

      {
        field: 'name',
        type: 'min',
        orderFields: [{ field: 'incorrect-value' as any, order: 'desc' }],
      },
    ];

    await api.fetchAggregatedData(aggregationsRequest);

    expect(mockKnexClient).toHaveBeenCalledWith('final_entities as fe');

    expect(mockQueryBuilder.orderBy).toHaveBeenCalledTimes(3);

    const [field, order] = mockQueryBuilder.orderBy.mock.calls[0];
    expect([field, order]).toEqual(['count', 'asc']);

    const [labelField, labelFieldOrder] =
      mockQueryBuilder.orderBy.mock.calls[1];
    expect([labelField, labelFieldOrder]).toEqual(['s2.value', 'desc']);

    const [nameField, nameFieldOrder] = mockQueryBuilder.orderBy.mock.calls[2];
    expect([nameField, nameFieldOrder]).toEqual(['s3.value', 'desc']);
  });
});
