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

import { DateTime } from 'luxon';

import { Filter } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';

export const combineFilters = (
  filters: (Filter | undefined)[],
): Filter | undefined => {
  const activeFilters = filters.filter(Boolean) as Filter[];
  if (activeFilters.length === 0) {
    return undefined;
  }
  if (activeFilters.length === 1) {
    return activeFilters[0];
  }
  return {
    operator: 'AND',
    filters: activeFilters,
  };
};

export const formatStartedRelative = (startIso?: string) => {
  if (!startIso) {
    return VALUE_UNAVAILABLE;
  }

  return DateTime.fromISO(startIso).toRelative() ?? VALUE_UNAVAILABLE;
};

/**
 * Builds a [start, end] ISO range for the started filter selector.
 *
 * Note: selector values are currently the localized option strings themselves
 * (see WorkflowRunsTabContent). The switch below matches the English labels.
 */
export const buildStartedDateRange = (
  startedSelectorValue: string,
  now: Date = new Date(),
): [string, string] | undefined => {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  switch (startedSelectorValue) {
    case 'Today': {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      return [startOfToday.toISOString(), endOfToday.toISOString()];
    }
    case 'Yesterday': {
      const startOfYesterday = new Date(now);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      return [startOfYesterday.toISOString(), endOfYesterday.toISOString()];
    }
    case 'Last 7 days': {
      const startOfLast7Days = new Date(now);
      startOfLast7Days.setDate(startOfLast7Days.getDate() - 7);
      startOfLast7Days.setHours(0, 0, 0, 0);

      return [startOfLast7Days.toISOString(), endOfToday.toISOString()];
    }
    case 'This month': {
      const startOfCurrentMonth = new Date(now);
      startOfCurrentMonth.setDate(1);
      startOfCurrentMonth.setHours(0, 0, 0, 0);

      return [startOfCurrentMonth.toISOString(), endOfToday.toISOString()];
    }
    default:
      return undefined;
  }
};

/** Drops the overflow probe row fetched via pageSize + 1. */
export const trimOverflowPage = <T>(items: T[], pageSize: number): T[] => {
  if (items.length === pageSize + 1) {
    return items.slice(0, -1);
  }
  return items;
};

export const hasNextPageFromFetch = (
  itemCount: number,
  pageSize: number,
): boolean => itemCount === pageSize + 1;

export const filterWorkflowRunsBySearch = (
  rows: WorkflowRunDetail[],
  search: string,
): WorkflowRunDetail[] => {
  const query = search.trim().toLowerCase();
  if (!query) {
    return rows;
  }

  return rows.filter(
    row =>
      row.id.toLowerCase().includes(query) ||
      row.processName.toLowerCase().includes(query) ||
      (row.version?.toLowerCase().includes(query) ?? false) ||
      (row.targetEntity?.toLowerCase().includes(query) ?? false) ||
      (row.initiatorEntity?.toLowerCase().includes(query) ?? false) ||
      (row.state?.toLowerCase().includes(query) ?? false) ||
      row.start.toLowerCase().includes(query),
  );
};
