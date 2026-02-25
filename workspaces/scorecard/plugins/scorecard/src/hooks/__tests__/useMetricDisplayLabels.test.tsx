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

import { renderHook } from '@testing-library/react';
import { useMetricDisplayLabels } from '../useMetricDisplayLabels';
import { MetricsDetails } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

describe('useMetricDisplayLabels', () => {
  it('should return empty title and description when metric is undefined', () => {
    const { result } = renderHook(() => useMetricDisplayLabels());

    expect(result.current).toEqual({ title: '', description: '' });
  });

  it('should return title and description as-is when metric is customized', () => {
    const metric = {
      id: 'github.open_prs',
      title: 'Admin custom title',
      description: 'Admin custom description.',
      type: 'number',
      isCustomized: true,
    } as MetricsDetails;

    const { result } = renderHook(() => useMetricDisplayLabels(metric));

    expect(result.current).toEqual({
      title: 'Admin custom title',
      description: 'Admin custom description.',
    });
  });

  it('should use metadata title and description when not customized', () => {
    const metric = {
      id: 'jira.open_issues',
      title: 'Jira open issues',
      description: 'Jira open issues description',
      type: 'number',
      isCustomized: false,
    } as MetricsDetails;

    const { result } = renderHook(() => useMetricDisplayLabels(metric));

    expect(result.current).toEqual({
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
    });
  });
});
