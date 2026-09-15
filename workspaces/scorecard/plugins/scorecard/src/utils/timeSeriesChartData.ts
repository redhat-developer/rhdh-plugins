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

import type {
  MetricTimeSeriesPoint,
  ScalarAggregatedTimeSeriesPoint,
  TimeSeriesPointError,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type SparklineChartPoint = {
  /** Unique key for x-axis positioning (original ISO timestamp). */
  date: string;
  /** Human-readable label shown on the x-axis and in the tooltip. */
  dateLabel: string;
  value: number | null;
  error?: string;
  plotValue: number;
};

export type TimeSeriesChartInputPoint = {
  value: MetricTimeSeriesPoint['value'] | null;
  timestamp: string;
  error?: string;
};

const toNumericValue = (
  value: TimeSeriesChartInputPoint['value'],
): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const interpolatePlotValue = (
  points: Array<Omit<SparklineChartPoint, 'plotValue'>>,
  index: number,
): number => {
  const current = points[index].value;
  if (current !== null) {
    return current;
  }

  let prevIndex = -1;
  for (let i = index - 1; i >= 0; i -= 1) {
    if (points[i].value !== null) {
      prevIndex = i;
      break;
    }
  }

  let nextIndex = -1;
  for (let i = index + 1; i < points.length; i += 1) {
    if (points[i].value !== null) {
      nextIndex = i;
      break;
    }
  }

  if (prevIndex !== -1 && nextIndex !== -1) {
    const prev = points[prevIndex].value as number;
    const next = points[nextIndex].value as number;
    const t = (index - prevIndex) / (nextIndex - prevIndex);
    return prev + (next - prev) * t;
  }

  if (prevIndex !== -1) {
    return points[prevIndex].value as number;
  }

  if (nextIndex !== -1) {
    return points[nextIndex].value as number;
  }

  return 0;
};

export const formatAggregatedTimeSeriesErrors = (
  errors?: TimeSeriesPointError[],
): string | undefined => {
  if (!errors?.length) {
    return undefined;
  }

  return errors
    .map(error =>
      error.count > 1 ? `${error.message} (${error.count})` : error.message,
    )
    .join('; ');
};

/**
 * Maps catalog-entity metric time-series points into sparkline input rows.
 * Calculation failures keep a tooltip string so the chart can mark them.
 */
export const toMetricSparklinePoints = (
  points: MetricTimeSeriesPoint[],
  fallbackErrorLabel: string,
): TimeSeriesChartInputPoint[] =>
  points.map(point => ({
    value: point.value,
    timestamp: point.timestamp,
    error:
      point.error ?? (point.value === null ? fallbackErrorLabel : undefined),
  }));

/**
 * Maps scalar aggregation time-series points into sparkline input rows.
 * Error days keep a tooltip string so the chart can mark them.
 */
export const toAggregationSparklinePoints = (
  points: ScalarAggregatedTimeSeriesPoint[],
  fallbackErrorLabel: string,
): TimeSeriesChartInputPoint[] =>
  points.map(point => ({
    value: point.value,
    timestamp: point.timestamp,
    error:
      point.status === 'error'
        ? formatAggregatedTimeSeriesErrors(point.errors) ?? fallbackErrorLabel
        : undefined,
  }));

/**
 * Maps API time-series points into chart rows. Error / null values keep their
 * x position and get an interpolated Y so the sparkline stays continuous.
 */
export const toSparklineChartData = (
  points: TimeSeriesChartInputPoint[],
  formatDateLabel: (timestamp: string) => string,
): SparklineChartPoint[] => {
  const raw = points.map(point => ({
    date: point.timestamp,
    dateLabel: formatDateLabel(point.timestamp),
    value: toNumericValue(point.value),
    error: point.error,
  }));

  return raw.map((point, index) => ({
    ...point,
    plotValue: interpolatePlotValue(raw, index),
  }));
};

export const getSparklineYDomain = (
  points: SparklineChartPoint[],
): [number, number] => {
  if (points.length === 0) {
    return [0, 1];
  }

  const values = points.map(point => point.plotValue);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return [min - pad, max + pad];
  }

  const pad = (max - min) * 0.1;
  return [min - pad, max + pad];
};
