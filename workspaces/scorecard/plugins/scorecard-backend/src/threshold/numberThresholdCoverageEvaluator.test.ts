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

import { validateThresholdNumberIntervals } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { ThresholdEvaluator } from './ThresholdEvaluator';

describe('numberThresholdCoverage vs ThresholdEvaluator', () => {
  const evaluator = new ThresholdEvaluator();

  it('should allow sampled values to match some rule when coverage passes', () => {
    const thresholds = {
      rules: [
        { key: 'low', expression: '<10' },
        { key: 'mid', expression: '10-20' },
        { key: 'high', expression: '>20' },
      ],
    };

    expect(() =>
      validateThresholdNumberIntervals(thresholds.rules, 'number'),
    ).not.toThrow();

    for (const x of [-1e6, -1, 0, 9.5, 10, 15, 20.001, 1e6]) {
      expect(
        evaluator.getFirstMatchingThreshold(x, 'number', thresholds),
      ).toBeDefined();
    }
  });

  it('should throw error when interval validation fails before evaluation', () => {
    const thresholds = {
      rules: [
        { key: 'low', expression: '<10' },
        { key: 'mid', expression: '11-20' },
        { key: 'high', expression: '>20' },
      ],
    };

    expect(() =>
      validateThresholdNumberIntervals(thresholds.rules, 'number'),
    ).toThrow(/do not cover the entire real line/);
  });
});
