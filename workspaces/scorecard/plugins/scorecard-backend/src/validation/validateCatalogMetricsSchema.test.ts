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

import { validateCatalogMetricsSchema } from './validateCatalogMetricsSchema';
import { InputError } from '@backstage/errors';

describe('validateCatalogMetricsSchema', () => {
  describe('valid query parameters', () => {
    it('should validate empty object', () => {
      expect(() => validateCatalogMetricsSchema({})).not.toThrow();
    });

    it('should validate object with valid metricIds string', () => {
      expect(() =>
        validateCatalogMetricsSchema({ metricIds: 'github.open_prs' }),
      ).not.toThrow();
    });

    it('should validate object with valid metricIds containing comma-separated values', () => {
      expect(() =>
        validateCatalogMetricsSchema({
          metricIds: 'github.open_prs,github.open_issues',
        }),
      ).not.toThrow();
    });

    it('should validate object with undefined metricIds', () => {
      expect(() =>
        validateCatalogMetricsSchema({ metricIds: undefined }),
      ).not.toThrow();
    });

    it('should validate when query has additional properties along with valid metricIds', () => {
      expect(() =>
        validateCatalogMetricsSchema({
          metricIds: 'github.open_prs',
          invalidProp: 'value',
        }),
      ).not.toThrow();
    });

    it('should validate when query has only additional properties', () => {
      expect(() =>
        validateCatalogMetricsSchema({ invalidProp: 'value' }),
      ).not.toThrow();
    });
  });

  describe('invalid query parameters', () => {
    it.each([
      { metricIds: '', description: 'empty string' },
      { metricIds: null, description: 'null' },
      { metricIds: 123, description: 'number' },
      { metricIds: true, description: 'boolean' },
      { metricIds: ['github.open_prs'], description: 'array' },
      { metricIds: { id: 'test' }, description: 'object' },
    ])(
      'should throw InputError when metricIds is $description',
      ({ metricIds }) => {
        expect(() => validateCatalogMetricsSchema({ metricIds })).toThrow(
          InputError,
        );
        expect(() => validateCatalogMetricsSchema({ metricIds })).toThrow(
          'Invalid query parameters',
        );
      },
    );
  });
});
