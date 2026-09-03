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

import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdEvaluator } from '../../threshold/ThresholdEvaluator';
import { classifyNumberAgainstThresholds } from './classifyNumberAgainstThresholds';

describe('classifyNumberAgainstThresholds', () => {
  const evaluator = new ThresholdEvaluator();

  it('fills default color and icon on the matching standard rule', () => {
    expect(
      classifyNumberAgainstThresholds(12, DEFAULT_NUMBER_THRESHOLDS, evaluator),
    ).toEqual({
      key: 'warning',
      expression: '10-50',
      color: 'warning.main',
      icon: 'scorecardWarningStatusIcon',
    });
  });
});
