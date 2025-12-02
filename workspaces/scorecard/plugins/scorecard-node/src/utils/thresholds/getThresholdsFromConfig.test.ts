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
import { validateThresholds } from './validateThresholds';
import { mockServices } from '@backstage/backend-test-utils';
import { getThresholdsFromConfig } from './getThresholdsFromConfig';

jest.mock('./validateThresholds');

const mockedValidateThresholds = validateThresholds as jest.MockedFunction<
  typeof validateThresholds
>;

const rules = [
  { key: 'error', expression: '>40' },
  { key: 'warning', expression: '>20' },
  { key: 'success', expression: '<=20' },
];

describe('getThresholdsFromConfig', () => {
  let mockedConfig: Config;

  beforeEach(() => {
    mockedConfig = mockServices.rootConfig({
      data: { scorecard: { rules } },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get optional thresholds from config', () => {
    jest.spyOn(mockedConfig, 'getOptional');
    getThresholdsFromConfig(mockedConfig, 'scorecard.rules', 'number');

    expect(mockedConfig.getOptional).toHaveBeenCalledWith('scorecard.rules');
  });

  describe('when thresholds config is present', () => {
    it('should validate thresholds config', () => {
      getThresholdsFromConfig(mockedConfig, 'scorecard.rules', 'number');
      expect(mockedValidateThresholds).toHaveBeenCalledWith(rules, 'number');
    });

    it('should return thresholds config', () => {
      const thresholds = getThresholdsFromConfig(
        mockedConfig,
        'scorecard.rules',
        'number',
      );
      expect(thresholds).toEqual(rules);
    });
  });

  it('should throw error message when thresholds validation is failed', () => {
    mockedValidateThresholds.mockImplementationOnce(() => {
      throw new Error('Invalid thresholds configuration');
    });

    expect(() =>
      getThresholdsFromConfig(mockedConfig, 'scorecard.rules', 'number'),
    ).toThrow('Invalid thresholds configuration');
  });

  it('should return undefined when thresholds config is not present', () => {
    jest.spyOn(mockedConfig, 'getOptional').mockReturnValue(undefined);
    const thresholds = getThresholdsFromConfig(
      mockedConfig,
      'scorecard.rules',
      'number',
    );

    expect(thresholds).toBeUndefined();
  });
});
