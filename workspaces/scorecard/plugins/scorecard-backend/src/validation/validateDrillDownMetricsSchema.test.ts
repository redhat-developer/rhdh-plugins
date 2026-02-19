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

describe('validateDrillDownMetricsSchema', () => {
  describe('valid query parameters', () => {
    it('should return defaults when given an empty object', () => {
      expect(validateDrillDownMetricsSchema({})).toEqual({
        page: 1,
        pageSize: 5,
        sortOrder: 'desc',
      });
    });

    it('should coerce page and pageSize from strings to numbers', () => {
      const result = validateDrillDownMetricsSchema({
        page: '3',
        pageSize: '20',
      });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
    });

    it('should accept page at max boundary of 10000', () => {
      const result = validateDrillDownMetricsSchema({ page: '10000' });
      expect(result.page).toBe(10000);
    });

    it('should accept pageSize at max boundary of 100', () => {
      const result = validateDrillDownMetricsSchema({ pageSize: '100' });
      expect(result.pageSize).toBe(100);
    });

    it.each(['success', 'warning', 'error'] as const)(
      'should accept status=%s',
      status => {
        const result = validateDrillDownMetricsSchema({ status });
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
      const result = validateDrillDownMetricsSchema({ sortBy });
      expect(result.sortBy).toBe(sortBy);
    });

    it.each(['asc', 'desc'] as const)(
      'should accept sortOrder=%s',
      sortOrder => {
        const result = validateDrillDownMetricsSchema({ sortOrder });
        expect(result.sortOrder).toBe(sortOrder);
      },
    );

    it('should normalize a single owner string to an array', () => {
      const result = validateDrillDownMetricsSchema({
        owner: 'team:default/platform',
      });
      expect(result.owner).toEqual(['team:default/platform']);
    });

    it('should accept an array of owner strings', () => {
      const result = validateDrillDownMetricsSchema({
        owner: ['team:default/platform', 'user:default/alice'],
      });
      expect(result.owner).toEqual([
        'team:default/platform',
        'user:default/alice',
      ]);
    });

    it('should return undefined when owner is not provided', () => {
      const result = validateDrillDownMetricsSchema({});
      expect(result.owner).toBeUndefined();
    });

    it('should accept a valid kind string', () => {
      const result = validateDrillDownMetricsSchema({ kind: 'Component' });
      expect(result.kind).toBe('Component');
    });

    it('should accept a valid entityName string', () => {
      const result = validateDrillDownMetricsSchema({
        entityName: 'my-service',
      });
      expect(result.entityName).toBe('my-service');
    });

    it('should accept all valid parameters together', () => {
      const result = validateDrillDownMetricsSchema({
        page: '2',
        pageSize: '10',
        status: 'error',
        sortBy: 'metricValue',
        sortOrder: 'asc',
        owner: 'team:default/backend',
        kind: 'Component',
        entityName: 'my-service',
      });

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
      const result = validateDrillDownMetricsSchema({ unknownProp: 'value' });
      expect(result).not.toHaveProperty('unknownProp');
    });
  });

  describe('invalid query parameters', () => {
    it('should throw InputError when page is 0', () => {
      expect(() => validateDrillDownMetricsSchema({ page: '0' })).toThrow(
        InputError,
      );
    });

    it('should throw InputError when page is negative', () => {
      expect(() => validateDrillDownMetricsSchema({ page: '-1' })).toThrow(
        InputError,
      );
    });

    it('should throw InputError when page exceeds 10000', () => {
      expect(() => validateDrillDownMetricsSchema({ page: '10001' })).toThrow(
        InputError,
      );
    });

    it('should throw InputError when pageSize is 0', () => {
      expect(() => validateDrillDownMetricsSchema({ pageSize: '0' })).toThrow(
        InputError,
      );
    });

    it('should throw InputError when pageSize exceeds 100', () => {
      expect(() => validateDrillDownMetricsSchema({ pageSize: '101' })).toThrow(
        InputError,
      );
    });

    it('should throw InputError when more than 50 owner values are provided', () => {
      const tooManyOwners = Array.from(
        { length: 51 },
        (_, i) => `team:default/team-${i}`,
      );
      expect(() =>
        validateDrillDownMetricsSchema({ owner: tooManyOwners }),
      ).toThrow(InputError);
      expect(() =>
        validateDrillDownMetricsSchema({ owner: tooManyOwners }),
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
          validateDrillDownMetricsSchema({ [field]: value }),
        ).toThrow(InputError);
        expect(() =>
          validateDrillDownMetricsSchema({ [field]: value }),
        ).toThrow('Invalid query parameters');
      },
    );

    it.each(['kind', 'entityName'])(
      'should throw InputError when %s is an empty string',
      field => {
        expect(() => validateDrillDownMetricsSchema({ [field]: '' })).toThrow(
          InputError,
        );
        expect(() => validateDrillDownMetricsSchema({ [field]: '' })).toThrow(
          'Invalid query parameters',
        );
      },
    );

    it('should throw InputError when owner contains an empty string', () => {
      expect(() => validateDrillDownMetricsSchema({ owner: [''] })).toThrow(
        InputError,
      );
      expect(() => validateDrillDownMetricsSchema({ owner: [''] })).toThrow(
        'Invalid query parameters',
      );
    });
  });
});
