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

import {
  ScorecardThresholdRuleColors,
  type ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const STANDARD_THRESHOLD_DEFAULTS: Record<
  string,
  { color: string; icon: string }
> = {
  success: {
    color: ScorecardThresholdRuleColors.SUCCESS,
    icon: 'scorecardSuccessStatusIcon',
  },
  warning: {
    color: ScorecardThresholdRuleColors.WARNING,
    icon: 'scorecardWarningStatusIcon',
  },
  error: {
    color: ScorecardThresholdRuleColors.ERROR,
    icon: 'scorecardErrorStatusIcon',
  },
};

export function withStandardThresholdDefaults(
  rule: ThresholdRule,
): ThresholdRule {
  const defaults = STANDARD_THRESHOLD_DEFAULTS[rule.key];
  if (!defaults) {
    return rule;
  }

  return {
    ...rule,
    color: rule.color ?? defaults.color,
    icon: rule.icon ?? defaults.icon,
  };
}
