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
import type { Request, Response } from 'express';
import { validateAggregationIdParam } from './validateAggregationIdParam';
import { validateMetricIdsQueryParams } from './validateMetricIdsQueryParams';
import { validateDatasourceQueryParams } from './validateDatasourceQueryParams';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    ...overrides,
  } as Request;
}

describe('Validators', () => {
  let next: jest.Mock;
  const res = {} as Response;

  beforeEach(() => {
    next = jest.fn();
  });

  describe('validateAggregationIdParam', () => {
    it('should call next when aggregationId is valid', () => {
      validateAggregationIdParam(
        mockReq({ params: { aggregationId: 'openIssuesKpi' } }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it.each([
      ['empty string', { aggregationId: '' }],
      ['missing', {}],
    ])('should throw InputError when aggregationId is %s', (_label, params) => {
      const req = mockReq({ params });

      expect(() => validateAggregationIdParam(req, res, next)).toThrow(
        InputError,
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw InputError when aggregationId exceeds 255 characters', () => {
      const req = mockReq({ params: { aggregationId: 'x'.repeat(256) } });

      expect(() => validateAggregationIdParam(req, res, next)).toThrow(
        InputError,
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateMetricIdsQueryParams', () => {
    it('should call next for empty query', () => {
      const req = mockReq();

      validateMetricIdsQueryParams(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when metricIds is a valid string', () => {
      const req = mockReq({ query: { metricIds: 'github.open_prs' } });

      validateMetricIdsQueryParams(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it.each([
      ['empty string', ''],
      ['number', 123],
      ['boolean', true],
      ['array', ['a']],
      ['object', { id: 'x' }],
    ])(
      'should throw InputError when metricIds is invalid (%s)',
      (_label, metricIds) => {
        const req = mockReq({ query: { metricIds } as any });

        expect(() => validateMetricIdsQueryParams(req, res, next)).toThrow(
          InputError,
        );
        expect(next).not.toHaveBeenCalled();
      },
    );

    it('should throw InputError when metricIds exceeds 255 characters', () => {
      const req = mockReq({ query: { metricIds: 'x'.repeat(256) } });

      expect(() => validateMetricIdsQueryParams(req, res, next)).toThrow(
        InputError,
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateDatasourceQueryParams', () => {
    it('should call next for empty query', () => {
      const req = mockReq();

      validateDatasourceQueryParams(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when datasource is a valid string', () => {
      const req = mockReq({ query: { datasource: 'github' } });

      validateDatasourceQueryParams(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it.each([
      ['empty string', ''],
      ['number', 123],
      ['boolean', true],
      ['array', ['github']],
      ['object', { id: 'x' }],
    ])(
      'should throw InputError when datasource is invalid (%s)',
      (_label, datasource) => {
        const req = mockReq({ query: { datasource } as any });

        expect(() => validateDatasourceQueryParams(req, res, next)).toThrow(
          InputError,
        );
        expect(next).not.toHaveBeenCalled();
      },
    );

    it('should throw InputError when datasource exceeds 255 characters', () => {
      const req = mockReq({ query: { datasource: 'x'.repeat(256) } });

      expect(() => validateDatasourceQueryParams(req, res, next)).toThrow(
        InputError,
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
