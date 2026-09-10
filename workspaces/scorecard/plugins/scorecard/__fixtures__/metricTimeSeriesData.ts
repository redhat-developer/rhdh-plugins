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

import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import { subDays } from 'date-fns';
import type {
  MetricTimeSeriesPoint,
  MetricTimeSeriesResponse,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

type SeriesProfile = {
  title: string;
  description: string;
  unit: string;
  collectorIds: string[];
  /** Oldest → newest. `null` is a calculation-error day. */
  dailyValues: Array<number | null>;
};

const DORA_COLLECTORS = ['github:deploymentWorkflowRuns', 'jira:incidents'];

const SERIES_BY_METRIC_ID: Record<string, SeriesProfile> = {
  'dora.deploymentFrequency': {
    title: 'DORA - Deployment Frequency',
    description:
      'Tracks how often code is successfully deployed to production over the past 30 days. Elite performers deploy on demand (multiple times per day).',
    unit: '/week',
    collectorIds: DORA_COLLECTORS,
    dailyValues: [
      4.2,
      5.1,
      6.8,
      null,
      7.4,
      8.1,
      9.0,
      6.5,
      5.8,
      7.2,
      8.6,
      3.1,
      null,
      6.9,
      7.5,
      8.2,
    ],
  },
  'dora.changeFailureRate': {
    title: 'DORA - Change Failure Rate',
    description:
      'Monitors the percentage of deployments that cause a failure in production over the past 30 days. Elite performers maintain a change failure rate below 5%.',
    unit: '%',
    collectorIds: DORA_COLLECTORS,
    dailyValues: [
      4.5,
      5.8,
      7.2,
      8.5,
      null,
      9.1,
      10.5,
      11.8,
      10.2,
      9.0,
      8.5,
      11.0,
      null,
      12.5,
      10.8,
      9.5,
    ],
  },
  'dora.medianLeadTimeForChanges': {
    title: 'DORA - Median Lead Time for Changes',
    description:
      'Measures the time from code commit to production deployment over the past 30 days. Elite performers have a lead time of less than 24 hours',
    unit: 'h',
    collectorIds: DORA_COLLECTORS,
    dailyValues: [
      140,
      165,
      180,
      200,
      null,
      220,
      250,
      230,
      210,
      240,
      260,
      280,
      null,
      300,
      270,
      250,
    ],
  },
  'dora.meanTimeToRestore': {
    title: 'DORA - Mean Time to Restore',
    description:
      'Tracks the average time to restore service after an incident over the past 30 days. Elite performers restore service in under one hour.',
    unit: 'h',
    collectorIds: DORA_COLLECTORS,
    dailyValues: [
      8.5,
      6.2,
      4.1,
      null,
      2.8,
      1.6,
      0.9,
      3.4,
      5.0,
      2.2,
      1.1,
      0.7,
      null,
      1.4,
      0.8,
      1.2,
    ],
  },
};

const DEFAULT_PROFILE = SERIES_BY_METRIC_ID['dora.deploymentFrequency'];

const utcDayTimestamp = (date: Date): string =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ).toISOString();

const eachUtcDayInclusive = (from: Date, to: Date): Date[] => {
  const days: Date[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );

  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
};

const ERROR_MESSAGES = ['GitHub API 500', 'Jira unavailable'];

const toPoint = (
  value: number | null,
  timestamp: string,
  dayIndex: number,
): MetricTimeSeriesPoint => {
  if (value === null) {
    return {
      value: null,
      timestamp,
      error: ERROR_MESSAGES[dayIndex % ERROR_MESSAGES.length],
    };
  }

  return { value, timestamp };
};

/**
 * Local dummy payload for `ScorecardApi.getMetricTimeSeries`.
 * Pass the same `entity` / `metricId` / `from` / `to` the client uses.
 */
export const mockMetricTimeSeriesData = (
  entity: Entity,
  metricId: string,
  from?: string,
  to?: string,
): MetricTimeSeriesResponse => {
  const profile = SERIES_BY_METRIC_ID[metricId] ?? {
    ...DEFAULT_PROFILE,
    title: metricId,
    description: '',
    collectorIds: metricId.startsWith('dora.') ? DORA_COLLECTORS : [],
  };

  const parsedTo = to ? new Date(to) : new Date();
  const end = Number.isNaN(parsedTo.getTime()) ? new Date() : parsedTo;
  const parsedFrom = from
    ? new Date(from)
    : subDays(end, profile.dailyValues.length - 1);
  const start = Number.isNaN(parsedFrom.getTime())
    ? subDays(end, profile.dailyValues.length - 1)
    : parsedFrom;

  const days = eachUtcDayInclusive(start, end);
  const points = (days.length > 0 ? days : [end]).map((day, index) => {
    const value =
      profile.dailyValues[index % profile.dailyValues.length] ?? null;
    return toPoint(value, utcDayTimestamp(day), index);
  });

  return {
    metricId,
    entityRef: stringifyEntityRef(entity),
    points,
    metadata: {
      title: profile.title,
      description: profile.description,
      type: 'number',
      unit: profile.unit,
      history: true,
      defaultVisualization: 'sparkline',
      collectorIds: profile.collectorIds,
    },
  };
};
