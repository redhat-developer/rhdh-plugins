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

export const SONARQUBE_METRICS = [
  'quality_gate',
  'open_issues',
  'security_rating',
  'security_issues',
] as const;

export type SonarQubeMetricId = (typeof SONARQUBE_METRICS)[number];

export const SONARQUBE_NUMBER_METRICS = [
  'open_issues',
  'security_rating',
  'security_issues',
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
    description:
      'Whether the project passes its SonarQube quality gate (true = OK, false = ERROR).',
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
};

export const SONARQUBE_BOOLEAN_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '==true' },
    { key: 'error', expression: '==false' },
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
  security_rating: {
    rules: [
      { key: 'success', expression: '<2' },
      { key: 'warning', expression: '2-3' },
      { key: 'error', expression: '>3' },
    ],
  },
  security_issues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
};
