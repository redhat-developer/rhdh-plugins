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

import { ScorecardThresholdRuleColors } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { withStandardThresholdDefaults } from './withStandardThresholdDefaults';

describe('withStandardThresholdDefaults', () => {
  it.each([
    [
      'success',
      ScorecardThresholdRuleColors.SUCCESS,
      'scorecardSuccessStatusIcon',
    ],
    [
      'warning',
      ScorecardThresholdRuleColors.WARNING,
      'scorecardWarningStatusIcon',
    ],
    ['error', ScorecardThresholdRuleColors.ERROR, 'scorecardErrorStatusIcon'],
  ] as const)(
    'fills default color and icon for %s when omitted',
    (key, color, icon) => {
      expect(withStandardThresholdDefaults({ key, expression: '<10' })).toEqual(
        {
          key,
          expression: '<10',
          color,
          icon,
        },
      );
    },
  );

  it('does not overwrite an explicit color or icon on a standard key', () => {
    expect(
      withStandardThresholdDefaults({
        key: 'success',
        expression: '<10',
        color: '#00ff00',
        icon: 'CustomIcon',
      }),
    ).toEqual({
      key: 'success',
      expression: '<10',
      color: '#00ff00',
      icon: 'CustomIcon',
    });
  });

  it('fills only the omitted standard default', () => {
    expect(
      withStandardThresholdDefaults({
        key: 'warning',
        expression: '10-50',
        color: '#ffaa00',
      }),
    ).toEqual({
      key: 'warning',
      expression: '10-50',
      color: '#ffaa00',
      icon: 'scorecardWarningStatusIcon',
    });
  });

  it('returns a custom-key rule unchanged', () => {
    const rule = { key: 'elite', expression: '>=7', color: 'success.main' };

    expect(withStandardThresholdDefaults(rule)).toBe(rule);
  });
});
