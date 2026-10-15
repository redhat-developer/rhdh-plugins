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
  RESOURCE_TYPE_SCORECARD_METRIC,
  scorecardMetricReadPermission,
  scorecardPermissions,
} from './permissions';

describe('scorecard permissions', () => {
  it('defines the metric read permission the backend authorizes', () => {
    expect(RESOURCE_TYPE_SCORECARD_METRIC).toBe('scorecard-metric');
    expect(scorecardMetricReadPermission).toEqual({
      name: 'scorecard.metric.read',
      attributes: { action: 'read' },
      type: 'resource',
      resourceType: RESOURCE_TYPE_SCORECARD_METRIC,
    });
    expect(scorecardPermissions).toEqual([scorecardMetricReadPermission]);
  });
});
