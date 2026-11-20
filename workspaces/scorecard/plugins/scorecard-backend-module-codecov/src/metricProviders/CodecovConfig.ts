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

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const CODECOV_METRICS = [
  'codeCoverage',
  'codeCoverageTrend',
  'trackedFiles',
  'trackedLines',
  'coveredLines',
  'partialLines',
  'missedLines',
] as const;

export type CodecovMetricId = (typeof CODECOV_METRICS)[number];

export const CODECOV_METRIC_CONFIG: Record<
  CodecovMetricId,
  { id: string; title: string; description: string; unit?: string }
> = {
  codeCoverage: {
    id: 'codecov.codeCoverage',
    title: 'Code coverage',
    description:
      'Current code coverage percentage for the default branch from Codecov.',
    unit: '%',
  },
  codeCoverageTrend: {
    id: 'codecov.codeCoverageTrend',
    title: 'Code coverage - Trend',
    description:
      'Code coverage change (diff) for the last 7 days from Codecov.',
  },
  trackedFiles: {
    id: 'codecov.trackedFiles',
    title: 'Code coverage - Tracked files',
    description: 'Number of files tracked for code coverage by Codecov.',
  },
  trackedLines: {
    id: 'codecov.trackedLines',
    title: 'Code coverage - Tracked lines of code',
    description:
      'Total number of lines of code tracked for coverage by Codecov.',
  },
  coveredLines: {
    id: 'codecov.coveredLines',
    title: 'Code coverage - Covered lines of code',
    description: 'Number of lines of code covered by tests from Codecov.',
  },
  partialLines: {
    id: 'codecov.partialLines',
    title: 'Code coverage - Partial covered lines of code',
    description:
      'Number of lines of code partially covered by tests from Codecov.',
  },
  missedLines: {
    id: 'codecov.missedLines',
    title: 'Code coverage - Missed lines of code',
    description: 'Number of lines of code not covered by tests from Codecov.',
  },
};

/**
 * Maps each metric to the field name in the Codecov totals response.
 */
export const CODECOV_TOTALS_FIELD_MAP: Record<CodecovMetricId, string> = {
  codeCoverage: 'coverage',
  codeCoverageTrend: 'diff',
  trackedFiles: 'files',
  trackedLines: 'lines',
  coveredLines: 'hits',
  partialLines: 'partials',
  missedLines: 'misses',
};

const PERCENTAGE_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>80' },
    { key: 'warning', expression: '50-80' },
    { key: 'error', expression: '<50' },
  ],
};

const COUNT_THRESHOLDS: ThresholdConfig = {
  rules: [],
};

const TREND_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>0' },
    { key: 'warning', expression: '==0' },
    { key: 'error', expression: '<0' },
  ],
};

export const CODECOV_THRESHOLDS: Record<CodecovMetricId, ThresholdConfig> = {
  codeCoverage: PERCENTAGE_THRESHOLDS,
  codeCoverageTrend: TREND_THRESHOLDS,
  trackedFiles: COUNT_THRESHOLDS,
  trackedLines: COUNT_THRESHOLDS,
  coveredLines: COUNT_THRESHOLDS,
  partialLines: COUNT_THRESHOLDS,
  missedLines: COUNT_THRESHOLDS,
};
