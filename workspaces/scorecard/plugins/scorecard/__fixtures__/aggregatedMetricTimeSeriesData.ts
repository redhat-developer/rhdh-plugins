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

import { subDays } from 'date-fns';
import {
  aggregationTypes,
  type AggregatedMetricTimeSeriesResponse,
  type ScalarAggregatedTimeSeriesPoint,
  type ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

type SeriesProfile = {
  metricId: string;
  title: string;
  description: string;
  unit: string;
  thresholds: ThresholdConfig;
  aggregationChartDisplayColor: string;
  /** Oldest → newest. `null` is a calculation-error day. */
  dailyValues: Array<number | null>;
};

const DEPLOYMENT_FREQUENCY_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '>=7', color: 'success.main' },
    { key: 'medium', expression: '1-7', color: 'warning.main' },
    { key: 'error', expression: '<1', color: 'error.main' },
  ],
};

const CHANGE_FAILURE_RATE_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '<5', color: 'success.main' },
    { key: 'medium', expression: '5-15', color: 'warning.main' },
    { key: 'low', expression: '>15', color: 'error.main' },
  ],
};

const LEAD_TIME_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '<24', color: 'success.main' },
    { key: 'medium', expression: '24-168', color: 'warning.main' },
    { key: 'low', expression: '>168', color: 'error.main' },
  ],
};

const SERIES_BY_AGGREGATION_ID: Record<string, SeriesProfile> = {
  avgDeploymentFrequency: {
    metricId: 'dora.deploymentFrequency',
    title: 'Average Deployment Frequency',
    description:
      'This KPI provides average weekly production deploys over a 30-day window per entity.',
    unit: '/week',
    thresholds: DEPLOYMENT_FREQUENCY_THRESHOLDS,
    aggregationChartDisplayColor: 'success.main',
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
  avgChangeFailureRate: {
    metricId: 'dora.changeFailureRate',
    title: 'Average Change Failure Rate',
    description:
      'This KPI provides average change failure rate over a 30-day window per entity.',
    unit: '%',
    thresholds: CHANGE_FAILURE_RATE_THRESHOLDS,
    aggregationChartDisplayColor: 'warning.main',
    dailyValues: [
      3.5,
      4.1,
      5.2,
      6.8,
      null,
      7.5,
      8.9,
      10.2,
      9.5,
      11.0,
      8.8,
      7.5,
      null,
      9.2,
      10.5,
      8.0,
    ],
  },
  avgMedianLeadTimeForChanges: {
    metricId: 'dora.medianLeadTimeForChanges',
    title: 'Average Median Lead Time for Changes',
    description:
      'This KPI provides average median lead time for changes in hours over a 30-day window per entity.',
    unit: 'h',
    thresholds: LEAD_TIME_THRESHOLDS,
    aggregationChartDisplayColor: 'error.main',
    dailyValues: [
      120,
      140,
      160,
      185,
      null,
      200,
      220,
      250,
      230,
      210,
      240,
      260,
      null,
      280,
      300,
      270,
    ],
  },
};

const DEFAULT_PROFILE = SERIES_BY_AGGREGATION_ID.avgDeploymentFrequency;

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

const toPoint = (
  value: number | null,
  timestamp: string,
  dayIndex: number,
): ScalarAggregatedTimeSeriesPoint => {
  if (value === null) {
    return {
      value: null,
      successCount: 0,
      errorCount: 3,
      total: 3,
      status: 'error',
      timestamp,
      errors: [
        { message: 'GitHub API 500', count: 2 },
        { message: 'Jira unavailable', count: 1 },
      ],
    };
  }

  const mixed = dayIndex % 7 === 3;
  const errorCount = mixed ? 2 : 0;
  const successCount = mixed ? 5 : 8;

  return {
    value,
    successCount,
    errorCount,
    total: successCount + errorCount,
    status: 'success',
    timestamp,
    ...(mixed ? { errors: [{ message: 'GitHub rate limit', count: 2 }] } : {}),
  };
};

/**
 * Local dummy payload for `ScorecardApi.getAggregationTimeSeries`.
 * Pass the same `aggregationId` / `from` / `to` the client uses.
 */
export const mockAggregatedMetricTimeSeriesData = (
  aggregationId: string,
  from?: string,
  to?: string,
): AggregatedMetricTimeSeriesResponse => {
  const profile = SERIES_BY_AGGREGATION_ID[aggregationId] ?? {
    ...DEFAULT_PROFILE,
    title: aggregationId,
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
    id: aggregationId,
    metricId: profile.metricId,
    metadata: {
      title: profile.title,
      description: profile.description,
      type: 'number',
      unit: profile.unit,
      history: true,
      visualization: 'sparkline',
      aggregationType: aggregationTypes.average,
    },
    points,
    thresholds: profile.thresholds,
    aggregationChartDisplayColor: profile.aggregationChartDisplayColor,
  };
};
