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

export const SONARQUBE_PROJECT_KEY_ANNOTATION = 'sonarqube.org/project-key';

export type SonarQubeAnnotation = {
  instanceName?: string;
  projectKey: string;
};

/**
 * Parses the `sonarqube.org/project-key` annotation value.
 * Supports an optional instance name prefix separated by `/`:
 *   - `my-project`              → { projectKey: 'my-project' }
 *   - `my-instance/my-project`  → { instanceName: 'my-instance', projectKey: 'my-project' }
 */
export function parseProjectKeyAnnotation(
  annotation: string,
): SonarQubeAnnotation {
  const slashIndex = annotation.indexOf('/');
  if (slashIndex === -1) {
    return { projectKey: annotation };
  }
  return {
    instanceName: annotation.substring(0, slashIndex),
    projectKey: annotation.substring(slashIndex + 1),
  };
}

export const SONARQUBE_METRICS = [
  'quality_gate',
  'open_issues',
  'security_rating',
  'security_issues',
  'security_review_rating',
  'security_hotspots',
  'reliability_rating',
  'reliability_issues',
  'maintainability_rating',
  'maintainability_issues',
  'code_coverage',
  'code_duplications',
] as const;

export type SonarQubeMetricId = (typeof SONARQUBE_METRICS)[number];

export const SONARQUBE_NUMBER_METRICS = [
  'open_issues',
  'security_rating',
  'security_issues',
  'security_review_rating',
  'security_hotspots',
  'reliability_rating',
  'reliability_issues',
  'maintainability_rating',
  'maintainability_issues',
  'code_coverage',
  'code_duplications',
] as const;

export type SonarQubeNumberMetricId = (typeof SONARQUBE_NUMBER_METRICS)[number];

export const SONARQUBE_BOOLEAN_METRICS = ['quality_gate'] as const;

export type SonarQubeBooleanMetricId =
  (typeof SONARQUBE_BOOLEAN_METRICS)[number];

export const SONARQUBE_METRIC_CONFIG: Record<
  SonarQubeMetricId,
  { id: string; title: string; description: string }
> = {
  quality_gate: {
    id: 'sonarqube.quality_gate',
    title: 'SonarQube Quality Gate Status',
    description: 'Whether the project passes its SonarQube quality gate.',
  },
  open_issues: {
    id: 'sonarqube.open_issues',
    title: 'SonarQube Open Issues',
    description:
      'Count of open issues (OPEN, CONFIRMED, REOPENED) in SonarQube.',
  },
  security_rating: {
    id: 'sonarqube.security_rating',
    title: 'SonarQube Security Rating',
    description: 'SonarQube security rating (A=1, B=2, C=3, D=4, E=5).',
  },
  security_issues: {
    id: 'sonarqube.security_issues',
    title: 'SonarQube Security Issues',
    description: 'Count of open security vulnerabilities in SonarQube.',
  },
  security_review_rating: {
    id: 'sonarqube.security_review_rating',
    title: 'SonarQube Security Review Rating',
    description: 'SonarQube security review rating (A=1, B=2, C=3, D=4, E=5).',
  },
  security_hotspots: {
    id: 'sonarqube.security_hotspots',
    title: 'SonarQube Security Hotspots',
    description: 'Count of security hotspots to review in SonarQube.',
  },
  reliability_rating: {
    id: 'sonarqube.reliability_rating',
    title: 'SonarQube Reliability Rating',
    description: 'SonarQube reliability rating (A=1, B=2, C=3, D=4, E=5).',
  },
  reliability_issues: {
    id: 'sonarqube.reliability_issues',
    title: 'SonarQube Reliability Issues',
    description: 'Count of open bugs in SonarQube.',
  },
  maintainability_rating: {
    id: 'sonarqube.maintainability_rating',
    title: 'SonarQube Maintainability Rating',
    description: 'SonarQube maintainability rating (A=1, B=2, C=3, D=4, E=5).',
  },
  maintainability_issues: {
    id: 'sonarqube.maintainability_issues',
    title: 'SonarQube Maintainability Issues',
    description: 'Count of open code smells in SonarQube.',
  },
  code_coverage: {
    id: 'sonarqube.code_coverage',
    title: 'SonarQube Code Coverage',
    description: 'Overall code coverage percentage in SonarQube.',
  },
  code_duplications: {
    id: 'sonarqube.code_duplications',
    title: 'SonarQube Code Duplications',
    description: 'Percentage of duplicated lines in SonarQube.',
  },
};

/**
 * Maps scorecard metric IDs to SonarQube API metric keys.
 * `open_issues` uses a dedicated API endpoint, so it has no measures key.
 */
export const SONARQUBE_API_METRIC_KEYS: Record<
  SonarQubeNumberMetricId,
  { apiKey: string } | { useIssuesApi: true }
> = {
  open_issues: { useIssuesApi: true },
  security_rating: { apiKey: 'security_rating' },
  security_issues: { apiKey: 'vulnerabilities' },
  security_review_rating: { apiKey: 'security_review_rating' },
  security_hotspots: { apiKey: 'security_hotspots' },
  reliability_rating: { apiKey: 'reliability_rating' },
  reliability_issues: { apiKey: 'bugs' },
  maintainability_rating: { apiKey: 'sqale_rating' },
  maintainability_issues: { apiKey: 'code_smells' },
  code_coverage: { apiKey: 'coverage' },
  code_duplications: { apiKey: 'duplicated_lines_density' },
};

export const SONARQUBE_BOOLEAN_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '==true' },
    { key: 'error', expression: '==false' },
  ],
};

const RATING_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<2' },
    { key: 'warning', expression: '2-3' },
    { key: 'error', expression: '>3' },
  ],
};

export const SONARQUBE_NUMBER_THRESHOLDS: Record<
  SonarQubeNumberMetricId,
  ThresholdConfig
> = {
  open_issues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-10' },
      { key: 'error', expression: '>10' },
    ],
  },
  security_rating: RATING_THRESHOLDS,
  security_review_rating: RATING_THRESHOLDS,
  reliability_rating: RATING_THRESHOLDS,
  maintainability_rating: RATING_THRESHOLDS,
  security_issues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
  security_hotspots: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
  reliability_issues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
  maintainability_issues: {
    rules: [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
  },
  code_coverage: {
    rules: [
      { key: 'success', expression: '>80' },
      { key: 'warning', expression: '50-80' },
      { key: 'error', expression: '<50' },
    ],
  },
  code_duplications: {
    rules: [
      { key: 'success', expression: '<3' },
      { key: 'warning', expression: '3-10' },
      { key: 'error', expression: '>10' },
    ],
  },
};
