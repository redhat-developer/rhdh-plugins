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

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import {
  buildStartedDateRange,
  combineFilters,
  filterWorkflowRunsBySearch,
  formatStartedRelative,
  hasNextPageFromFetch,
  trimOverflowPage,
} from './WorkflowRunsTabContent.helpers';

describe('combineFilters', () => {
  it('returns undefined when no filters are active', () => {
    expect(combineFilters([undefined, undefined])).toBeUndefined();
  });

  it('returns the single active filter', () => {
    const filter = { operator: 'EQ' as const, field: 'state', value: 'Active' };
    expect(combineFilters([undefined, filter])).toEqual(filter);
  });

  it('AND-combines multiple filters', () => {
    const a = { operator: 'EQ' as const, field: 'state', value: 'Active' };
    const b = { operator: 'EQ' as const, field: 'processId', value: 'wf' };
    expect(combineFilters([a, b])).toEqual({
      operator: 'AND',
      filters: [a, b],
    });
  });
});

describe('formatStartedRelative', () => {
  it('returns unavailable when start is missing', () => {
    expect(formatStartedRelative(undefined)).toBe(VALUE_UNAVAILABLE);
  });

  it('formats a valid ISO timestamp relatively', () => {
    const result = formatStartedRelative(new Date().toISOString());
    expect(result).not.toBe(VALUE_UNAVAILABLE);
    expect(typeof result).toBe('string');
  });
});

describe('buildStartedDateRange', () => {
  // Local calendar date avoids TZ drift in assertions.
  const now = new Date(2024, 5, 15, 12, 0, 0);

  it('builds Today / Yesterday / Last 7 days / This month ranges', () => {
    const today = buildStartedDateRange('Today', now)!;
    expect(new Date(today[0]).getDate()).toBe(15);
    expect(new Date(today[0]).getHours()).toBe(0);
    expect(new Date(today[1]).getHours()).toBe(23);

    const yesterday = buildStartedDateRange('Yesterday', now)!;
    expect(new Date(yesterday[0]).getDate()).toBe(14);
    expect(new Date(yesterday[1]).getDate()).toBe(14);

    const last7 = buildStartedDateRange('Last 7 days', now)!;
    expect(new Date(last7[0]).getDate()).toBe(8);

    const month = buildStartedDateRange('This month', now)!;
    expect(new Date(month[0]).getDate()).toBe(1);
    expect(new Date(month[0]).getMonth()).toBe(5);
  });

  it('returns undefined for unknown selector values', () => {
    expect(buildStartedDateRange('All', now)).toBeUndefined();
  });
});

describe('trimOverflowPage / hasNextPageFromFetch', () => {
  it('trims the overflow probe row', () => {
    expect(trimOverflowPage([1, 2, 3, 4], 3)).toEqual([1, 2, 3]);
    expect(trimOverflowPage([1, 2, 3], 3)).toEqual([1, 2, 3]);
  });

  it('detects an additional page from the overflow row', () => {
    expect(hasNextPageFromFetch(4, 3)).toBe(true);
    expect(hasNextPageFromFetch(3, 3)).toBe(false);
  });
});

describe('filterWorkflowRunsBySearch', () => {
  const rows: WorkflowRunDetail[] = [
    {
      id: 'abc-123',
      processName: 'Greeting',
      workflowId: 'greeting',
      start: 'Jun 1, 2024',
      startIso: '2024-06-01T00:00:00.000Z',
      duration: '1 minute',
      state: ProcessInstanceStatusDTO.Completed,
      version: '1.0.0',
      targetEntity: 'component:default/app',
      initiatorEntity: 'user:default/alice',
      hasVariables: false,
    },
    {
      id: 'xyz-999',
      processName: 'Assessment',
      workflowId: 'assessment',
      start: 'Jun 2, 2024',
      startIso: '2024-06-02T00:00:00.000Z',
      duration: '2 minutes',
      state: ProcessInstanceStatusDTO.Error,
      hasVariables: false,
    },
  ];

  it('returns all rows for empty search', () => {
    expect(filterWorkflowRunsBySearch(rows, '  ')).toEqual(rows);
  });

  it('filters by id, name, state, and entity fields', () => {
    expect(filterWorkflowRunsBySearch(rows, 'greeting')).toEqual([rows[0]]);
    expect(filterWorkflowRunsBySearch(rows, 'alice')).toEqual([rows[0]]);
    expect(filterWorkflowRunsBySearch(rows, 'error')).toEqual([rows[1]]);
  });
});
