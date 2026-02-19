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
import { InputError } from '@backstage/errors';
import { validateDrillDownMetricsSchema } from './validateDrillDownMetricsSchema';
import { mockServices } from '@backstage/backend-test-utils';

describe('validateDrillDownMetricsSchema', () => {
  describe('valid query parameters', () => {
    it('should return defaults when given an empty object', () => {
      expect(
        validateDrillDownMetricsSchema({}, mockServices.logger.mock()),
      ).toEqual({
        page: 1,
        pageSize: 5,
        sortOrder: 'desc',
      });
    });

    it('should coerce page and pageSize from strings to numbers', () => {
      const result = validateDrillDownMetricsSchema(
        {
          page: '3',
          pageSize: '20',
        },
        mockServices.logger.mock(),
      );
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
    });

    it('should accept page at max boundary of 10000', () => {
      const result = validateDrillDownMetricsSchema(
        { page: '10000' },
        mockServices.logger.mock(),
      );
      expect(result.page).toBe(10000);
    });

    it('should accept pageSize at max boundary of 100', () => {
      const result = validateDrillDownMetricsSchema(
        { pageSize: '100' },
        mockServices.logger.mock(),
      );
      expect(result.pageSize).toBe(100);
    });

    it.each(['success', 'warning', 'error'] as const)(
      'should accept status=%s',
      status => {
        const result = validateDrillDownMetricsSchema(
          { status },
          mockServices.logger.mock(),
        );
        expect(result.status).toBe(status);
      },
    );

    it.each([
      'entityName',
      'owner',
      'entityKind',
      'timestamp',
      'metricValue',
    ] as const)('should accept sortBy=%s', sortBy => {
      const result = validateDrillDownMetricsSchema(
        { sortBy },
        mockServices.logger.mock(),
      );
      expect(result.sortBy).toBe(sortBy);
    });

    it.each(['asc', 'desc'] as const)(
      'should accept sortOrder=%s',
      sortOrder => {
        const result = validateDrillDownMetricsSchema(
          { sortOrder },
          mockServices.logger.mock(),
        );
        expect(result.sortOrder).toBe(sortOrder);
      },
    );

    it('should normalize a single owner string to an array', () => {
      const result = validateDrillDownMetricsSchema(
        {
          owner: 'team:default/platform',
        },
        mockServices.logger.mock(),
      );
      expect(result.owner).toEqual(['team:default/platform']);
    });

    it('should accept an array of owner strings', () => {
      const result = validateDrillDownMetricsSchema(
        {
          owner: ['team:default/platform', 'user:default/alice'],
        },
        mockServices.logger.mock(),
      );
      expect(result.owner).toEqual([
        'team:default/platform',
        'user:default/alice',
      ]);
    });

    it('should return undefined when owner is not provided', () => {
      const result = validateDrillDownMetricsSchema(
        {},
        mockServices.logger.mock(),
      );
      expect(result.owner).toBeUndefined();
    });

    it('should accept a valid kind string', () => {
      const result = validateDrillDownMetricsSchema(
        { kind: 'Component' },
        mockServices.logger.mock(),
      );
      expect(result.kind).toBe('Component');
    });

    it('should accept a valid entityName string', () => {
      const result = validateDrillDownMetricsSchema(
        {
          entityName: 'my-service',
        },
        mockServices.logger.mock(),
      );
      expect(result.entityName).toBe('my-service');
    });

    it('should accept all valid parameters together', () => {
      const result = validateDrillDownMetricsSchema(
        {
          page: '2',
          pageSize: '10',
          status: 'error',
          sortBy: 'metricValue',
          sortOrder: 'asc',
          owner: 'team:default/backend',
          kind: 'Component',
          entityName: 'my-service',
        },
        mockServices.logger.mock(),
      );

      expect(result).toEqual({
        page: 2,
        pageSize: 10,
        status: 'error',
        sortBy: 'metricValue',
        sortOrder: 'asc',
        owner: ['team:default/backend'],
        kind: 'Component',
        entityName: 'my-service',
      });
    });

    it('should strip unknown properties', () => {
      const result = validateDrillDownMetricsSchema(
        { unknownProp: 'value' },
        mockServices.logger.mock(),
      );
      expect(result).not.toHaveProperty('unknownProp');
    });
  });

  describe('invalid query parameters', () => {
    it('should throw InputError when page is 0', () => {
      expect(() =>
        validateDrillDownMetricsSchema(
          { page: '0' },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
    });

    it('should throw InputError when page is negative', () => {
      expect(() =>
        validateDrillDownMetricsSchema(
          { page: '-1' },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
    });

    it('should throw InputError when page exceeds 10000', () => {
      expect(() =>
        validateDrillDownMetricsSchema(
          { page: '10001' },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
    });

    it('should throw InputError when pageSize is 0', () => {
      expect(() =>
        validateDrillDownMetricsSchema(
          { pageSize: '0' },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
    });

    it('should throw InputError when pageSize exceeds 100', () => {
      expect(() =>
        validateDrillDownMetricsSchema(
          { pageSize: '101' },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
    });

    it('should throw InputError when more than 50 owner values are provided', () => {
      const tooManyOwners = Array.from(
        { length: 51 },
        (_, i) => `team:default/team-${i}`,
      );
      expect(() =>
        validateDrillDownMetricsSchema(
          { owner: tooManyOwners },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
      expect(() =>
        validateDrillDownMetricsSchema(
          { owner: tooManyOwners },
          mockServices.logger.mock(),
        ),
      ).toThrow('Invalid query parameters');
    });

    it.each([
      { field: 'status', value: 'unknown' },
      { field: 'sortBy', value: 'invalid' },
      { field: 'sortOrder', value: 'random' },
    ])(
      'should throw InputError when $field has invalid value "$value"',
      ({ field, value }) => {
        expect(() =>
          validateDrillDownMetricsSchema(
            { [field]: value },
            mockServices.logger.mock(),
          ),
        ).toThrow(InputError);
        expect(() =>
          validateDrillDownMetricsSchema(
            { [field]: value },
            mockServices.logger.mock(),
          ),
        ).toThrow('Invalid query parameters');
      },
    );

    it.each(['kind', 'entityName'])(
      'should throw InputError when %s is an empty string',
      field => {
        expect(() =>
          validateDrillDownMetricsSchema(
            { [field]: '' },
            mockServices.logger.mock(),
          ),
        ).toThrow(InputError);
        expect(() =>
          validateDrillDownMetricsSchema(
            { [field]: '' },
            mockServices.logger.mock(),
          ),
        ).toThrow('Invalid query parameters');
      },
    );

    it('should throw InputError when owner contains an empty string', () => {
      expect(() =>
        validateDrillDownMetricsSchema(
          { owner: [''] },
          mockServices.logger.mock(),
        ),
      ).toThrow(InputError);
      expect(() =>
        validateDrillDownMetricsSchema(
          { owner: [''] },
          mockServices.logger.mock(),
        ),
      ).toThrow('Invalid query parameters');
    });
  });
});
