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

import { mockServices } from '@backstage/backend-test-utils';
import { InputError } from '@backstage/errors';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateAggregationConfig } from './validateAggregationConfig';

const validAggregationConfig = {
  id: 'openPrsKpi',
  type: aggregationTypes.statusGrouped,
  title: 'GitHub PRs',
  description: 'Open pull requests',
  metricId: 'github.open_prs',
};

describe('validateAggregationConfig', () => {
  let logger: ReturnType<typeof mockServices.logger.mock>;

  beforeEach(() => {
    logger = mockServices.logger.mock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return parsed AggregationConfig for valid input', () => {
    const result = validateAggregationConfig(validAggregationConfig, logger);
    expect(result).toEqual(validAggregationConfig);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should strip unknown keys (Zod object default)', () => {
    const result = validateAggregationConfig(
      { ...validAggregationConfig, extraField: 'ignored' } as unknown,
      logger,
    );
    expect(result).not.toHaveProperty('extraField');
    expect(result).toEqual(validAggregationConfig);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should call logger.warn and throw InputError when type is invalid', () => {
    expect(() =>
      validateAggregationConfig(
        { ...validAggregationConfig, type: 'unknownType' },
        logger,
      ),
    ).toThrow(InputError);

    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid aggregation config:',
      expect.objectContaining({ errors: expect.any(String) }),
    );
  });

  it.each([
    ['id', { ...validAggregationConfig, id: '' }],
    ['title', { ...validAggregationConfig, title: '' }],
    ['description', { ...validAggregationConfig, description: '' }],
    ['metricId', { ...validAggregationConfig, metricId: '' }],
  ])('should throw InputError when %s is empty', (_field, config) => {
    expect(() => validateAggregationConfig(config, logger)).toThrow(InputError);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should throw InputError when a string exceeds max length 255', () => {
    const long = 'a'.repeat(256);
    expect(() =>
      validateAggregationConfig(
        { ...validAggregationConfig, id: long },
        logger,
      ),
    ).toThrow(InputError);
  });

  it('should throw InputError when required field is missing', () => {
    const { metricId: _m, ...withoutMetric } = validAggregationConfig;
    expect(() =>
      validateAggregationConfig(withoutMetric as unknown, logger),
    ).toThrow(InputError);
  });
});
