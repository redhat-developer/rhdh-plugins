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
import { AggregationsRequest } from '../types';
import { AggregationsSchema, EntityFilterQuery } from './schema';

describe('EntityFilterQuery schema', () => {
  it('should validate an object with string keys and string values', () => {
    const validData = {
      key1: 'value1',
      key2: 'value2',
      anotherKey: 'anotherValue',
    };

    expect(() => EntityFilterQuery.parse(validData)).not.toThrow();
    const result = EntityFilterQuery.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should reject an object with non-string keys or values', () => {
    const invalidData1 = {
      key1: 'value1',
      key2: 123, // invalid value
    };

    expect(() => EntityFilterQuery.parse(invalidData1)).toThrow();
  });

  it('should reject non-object types', () => {
    const invalidData1 = 'not an object';
    const invalidData2 = 123;
    const invalidData3 = ['array', 'of', 'strings'];

    expect(() => EntityFilterQuery.parse(invalidData1)).toThrow();
    expect(() => EntityFilterQuery.parse(invalidData2)).toThrow();
    expect(() => EntityFilterQuery.parse(invalidData3)).toThrow();
  });

  it('should allow an empty object', () => {
    const validData = {};

    expect(() => EntityFilterQuery.parse(validData)).not.toThrow();
    const result = EntityFilterQuery.parse(validData);
    expect(result).toEqual(validData);
  });
});

describe('AggregationsSchema', () => {
  it('should not allow an empty array', () => {
    const invalidData: AggregationsRequest = [];

    expect(() => AggregationsSchema.parse(invalidData)).toThrow(
      'Array must contain at least 1 element(s)',
    );
  });

  it('should not throw error for valid data', () => {
    const validData: AggregationsRequest = [
      {
        type: 'count',
        field: 'kind',
        filter: { kind: 'plugin' },
        havingFilters: [{ field: 'count', operator: '>', value: '1' }],
        orderFields: [{ field: 'count', order: 'asc' }],
      },
    ];

    expect(() => AggregationsSchema.parse(validData)).not.toThrow();
  });

  it('should not allow invalid type', () => {
    const invalidData: AggregationsRequest = [
      {
        type: 'invalid' as any,
        field: 'kind',
      },
    ];

    expect(() => AggregationsSchema.parse(invalidData)).toThrow(
      `Invalid enum value. Expected 'count' | 'min' | 'max' | 'avg' | 'sum', received 'invalid'`,
    );
  });
});
