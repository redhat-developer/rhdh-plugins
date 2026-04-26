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

import type { Config } from '@backstage/config';
import { mockServices } from '@backstage/backend-test-utils';
import { getThresholdsFromConfig } from './getThresholdsFromConfig';
import { validateThresholdsForMetric } from './validateThresholds';

jest.mock('./validateThresholds', () => ({
  validateThresholdsForMetric: jest.fn(),
}));

const mockedValidateThresholdsForMetric =
  validateThresholdsForMetric as jest.MockedFunction<
    typeof validateThresholdsForMetric
  >;

const rules = [
  { key: 'error', expression: '>40' },
  { key: 'warning', expression: '>20' },
  { key: 'success', expression: '<=20' },
];

const thresholdConfig = { rules };

describe('getThresholdsFromConfig', () => {
  let mockedConfig: Config;

  beforeEach(() => {
    mockedConfig = mockServices.rootConfig({
      data: { scorecard: { defaultMetricThresholds: thresholdConfig } },
    });
    mockedValidateThresholdsForMetric.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get optional thresholds from config', () => {
    jest.spyOn(mockedConfig, 'getOptional');
    getThresholdsFromConfig(
      mockedConfig,
      'scorecard.defaultMetricThresholds',
      'number',
    );

    expect(mockedConfig.getOptional).toHaveBeenCalledWith(
      'scorecard.defaultMetricThresholds',
    );
  });

  describe('when thresholds config is present', () => {
    it('should validate thresholds config', () => {
      getThresholdsFromConfig(
        mockedConfig,
        'scorecard.defaultMetricThresholds',
        'number',
      );
      expect(mockedValidateThresholdsForMetric).toHaveBeenCalledWith(
        thresholdConfig,
        'number',
      );
    });

    it('should return thresholds config', () => {
      const thresholds = getThresholdsFromConfig(
        mockedConfig,
        'scorecard.defaultMetricThresholds',
        'number',
      );
      expect(thresholds).toEqual(thresholdConfig);
    });
  });

  it('should throw error message when thresholds validation is failed', () => {
    mockedValidateThresholdsForMetric.mockImplementationOnce(() => {
      throw new Error('Invalid thresholds configuration');
    });

    expect(() =>
      getThresholdsFromConfig(
        mockedConfig,
        'scorecard.defaultMetricThresholds',
        'number',
      ),
    ).toThrow(
      /Invalid thresholds configuration at scorecard\.defaultMetricThresholds/,
    );
  });

  it('should return undefined when thresholds config is not present', () => {
    jest.spyOn(mockedConfig, 'getOptional').mockReturnValue(undefined);
    const thresholds = getThresholdsFromConfig(
      mockedConfig,
      'scorecard.defaultMetricThresholds',
      'number',
    );

    expect(thresholds).toBeUndefined();
  });
});
