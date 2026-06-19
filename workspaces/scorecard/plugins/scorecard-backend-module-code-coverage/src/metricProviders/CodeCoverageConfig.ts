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

export const CODE_COVERAGE_ANNOTATION = 'backstage.io/code-coverage';

export const CODE_COVERAGE_METRICS = [
  'line_percentage',
  'line_available',
  'line_covered',
  'line_missed',
  'branch_percentage',
  'branch_available',
  'branch_covered',
  'branch_missed',
] as const;

export type CodeCoverageMetricId = (typeof CODE_COVERAGE_METRICS)[number];

export const CODE_COVERAGE_METRIC_CONFIG: Record<
  CodeCoverageMetricId,
  { id: string; title: string; description: string }
> = {
  line_percentage: {
    id: 'code-coverage.line_percentage',
    title: 'Code coverage (Lines)',
    description: 'Percentage of lines covered by tests.',
  },
  line_available: {
    id: 'code-coverage.line_available',
    title: 'Code coverage - Tracked lines of code',
    description: 'Total number of lines tracked for code coverage.',
  },
  line_covered: {
    id: 'code-coverage.line_covered',
    title: 'Code coverage - Covered lines of code',
    description: 'Number of lines covered by tests.',
  },
  line_missed: {
    id: 'code-coverage.line_missed',
    title: 'Code coverage - Missed lines of code',
    description: 'Number of lines not covered by tests.',
  },
  branch_percentage: {
    id: 'code-coverage.branch_percentage',
    title: 'Code coverage (Branches)',
    description: 'Percentage of branches covered by tests.',
  },
  branch_available: {
    id: 'code-coverage.branch_available',
    title: 'Code coverage - Tracked branches',
    description: 'Total number of branches tracked for code coverage.',
  },
  branch_covered: {
    id: 'code-coverage.branch_covered',
    title: 'Code coverage - Covered branches',
    description: 'Number of branches covered by tests.',
  },
  branch_missed: {
    id: 'code-coverage.branch_missed',
    title: 'Code coverage - Missed branches',
    description: 'Number of branches not covered by tests.',
  },
};

/**
 * Maps metric IDs to the path within the code-coverage report aggregate.
 */
export const CODE_COVERAGE_AGGREGATE_KEYS: Record<
  CodeCoverageMetricId,
  {
    section: 'line' | 'branch';
    field: 'percentage' | 'available' | 'covered' | 'missed';
  }
> = {
  line_percentage: { section: 'line', field: 'percentage' },
  line_available: { section: 'line', field: 'available' },
  line_covered: { section: 'line', field: 'covered' },
  line_missed: { section: 'line', field: 'missed' },
  branch_percentage: { section: 'branch', field: 'percentage' },
  branch_available: { section: 'branch', field: 'available' },
  branch_covered: { section: 'branch', field: 'covered' },
  branch_missed: { section: 'branch', field: 'missed' },
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

export const CODE_COVERAGE_THRESHOLDS: Record<
  CodeCoverageMetricId,
  ThresholdConfig
> = {
  line_percentage: PERCENTAGE_THRESHOLDS,
  line_available: COUNT_THRESHOLDS,
  line_covered: COUNT_THRESHOLDS,
  line_missed: COUNT_THRESHOLDS,
  branch_percentage: PERCENTAGE_THRESHOLDS,
  branch_available: COUNT_THRESHOLDS,
  branch_covered: COUNT_THRESHOLDS,
  branch_missed: COUNT_THRESHOLDS,
};
