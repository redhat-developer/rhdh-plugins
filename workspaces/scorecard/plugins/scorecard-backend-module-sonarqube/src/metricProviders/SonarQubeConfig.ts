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

import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
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
export function parseProjectKeyAnnotation(entity: Entity): SonarQubeAnnotation {
  const annotation =
    entity.metadata.annotations?.[SONARQUBE_PROJECT_KEY_ANNOTATION];
  if (!annotation) {
    throw new Error(
      `Missing annotation '${SONARQUBE_PROJECT_KEY_ANNOTATION}' for entity ${stringifyEntityRef(
        entity,
      )}`,
    );
  }
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
  'qualityGate',
  'openIssues',
  'securityRating',
  'securityIssues',
  'securityReviewRating',
  'securityHotspots',
  'reliabilityRating',
  'reliabilityIssues',
  'maintainabilityRating',
  'maintainabilityIssues',
  'codeCoverage',
  'codeDuplications',
] as const;

export type SonarQubeMetricId = (typeof SONARQUBE_METRICS)[number];

export const SONARQUBE_BOOLEAN_METRICS = ['qualityGate'] as const;

export type SonarQubeBooleanMetricId =
  (typeof SONARQUBE_BOOLEAN_METRICS)[number];

export const SONARQUBE_NUMBER_METRICS = [
  'openIssues',
  'securityRating',
  'securityIssues',
  'securityReviewRating',
  'securityHotspots',
  'reliabilityRating',
  'reliabilityIssues',
  'maintainabilityRating',
  'maintainabilityIssues',
  'codeCoverage',
  'codeDuplications',
] as const;

export type SonarQubeNumberMetricId = (typeof SONARQUBE_NUMBER_METRICS)[number];

export const SONARQUBE_METRIC_CONFIG: Record<
  SonarQubeMetricId,
  { id: string; title: string; description: string }
> = {
  qualityGate: {
    id: 'sonarqube.qualityGate',
    title: 'SonarQube Quality Gate Status',
    description: 'Whether the project passes its SonarQube quality gate.',
  },
  openIssues: {
    id: 'sonarqube.openIssues',
    title: 'SonarQube Open Issues',
    description:
      'Count of open issues (OPEN, CONFIRMED, REOPENED) in SonarQube.',
  },
  securityRating: {
    id: 'sonarqube.securityRating',
    title: 'SonarQube Security Rating',
    description: 'SonarQube security rating.',
  },
  securityIssues: {
    id: 'sonarqube.securityIssues',
    title: 'SonarQube Security Issues',
    description: 'Count of open security vulnerabilities in SonarQube.',
  },
  securityReviewRating: {
    id: 'sonarqube.securityReviewRating',
    title: 'SonarQube Security Review Rating',
    description: 'SonarQube security review rating.',
  },
  securityHotspots: {
    id: 'sonarqube.securityHotspots',
    title: 'SonarQube Security Hotspots',
    description: 'Count of security hotspots to review in SonarQube.',
  },
  reliabilityRating: {
    id: 'sonarqube.reliabilityRating',
    title: 'SonarQube Reliability Rating',
    description: 'SonarQube reliability rating.',
  },
  reliabilityIssues: {
    id: 'sonarqube.reliabilityIssues',
    title: 'SonarQube Reliability Issues',
    description: 'Count of open bugs in SonarQube.',
  },
  maintainabilityRating: {
    id: 'sonarqube.maintainabilityRating',
    title: 'SonarQube Maintainability Rating',
    description: 'SonarQube maintainability rating.',
  },
  maintainabilityIssues: {
    id: 'sonarqube.maintainabilityIssues',
    title: 'SonarQube Maintainability Issues',
    description: 'Count of open code smells in SonarQube.',
  },
  codeCoverage: {
    id: 'sonarqube.codeCoverage',
    title: 'SonarQube Code Coverage',
    description: 'Overall code coverage percentage in SonarQube.',
  },
  codeDuplications: {
    id: 'sonarqube.codeDuplications',
    title: 'SonarQube Code Duplications',
    description: 'Percentage of duplicated lines in SonarQube.',
  },
};

/**
 * Maps scorecard metric IDs to SonarQube API metric keys.
 * `openIssues` uses a dedicated API endpoint, so it has no measures key.
 */
export const SONARQUBE_API_METRIC_KEYS: Record<
  SonarQubeMetricId,
  { apiKey: string } | { useQualityGateApi: true } | { useOpenIssuesApi: true }
> = {
  qualityGate: { useQualityGateApi: true },
  openIssues: { useOpenIssuesApi: true },
  securityRating: { apiKey: 'security_rating' },
  securityIssues: { apiKey: 'vulnerabilities' },
  securityReviewRating: { apiKey: 'security_review_rating' },
  securityHotspots: { apiKey: 'security_hotspots' },
  reliabilityRating: { apiKey: 'reliability_rating' },
  reliabilityIssues: { apiKey: 'bugs' },
  maintainabilityRating: { apiKey: 'sqale_rating' },
  maintainabilityIssues: { apiKey: 'code_smells' },
  codeCoverage: { apiKey: 'coverage' },
  codeDuplications: { apiKey: 'duplicated_lines_density' },
};

export const SONARQUBE_BOOLEAN_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '==true' },
    { key: 'error', expression: '==false' },
  ],
};

const RATING_THRESHOLDS: ThresholdConfig = {
  rules: [
    {
      key: 'A',
      expression: '==1',
      color: 'success.main',
      icon: 'scorecardSuccessStatusIcon',
    },
    {
      key: 'B',
      expression: '==2',
      color: '#bdcb28',
      icon: 'scorecardSuccessStatusIcon',
    },
    {
      key: 'C',
      expression: '==3',
      color: 'warning.main',
      icon: 'scorecardWarningStatusIcon',
    },
    {
      key: 'D',
      expression: '==4',
      color: '#cf5813',
      icon: 'scorecardErrorStatusIcon',
    },
    {
      key: 'E',
      expression: '==5',
      color: 'error.main',
      icon: 'scorecardErrorStatusIcon',
    },
  ],
};

export const SONARQUBE_NUMBER_THRESHOLDS: Record<
  SonarQubeNumberMetricId,
  ThresholdConfig
> = {
  openIssues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-10' },
      { key: 'error', expression: '>10' },
    ],
  },
  securityRating: RATING_THRESHOLDS,
  securityReviewRating: RATING_THRESHOLDS,
  reliabilityRating: RATING_THRESHOLDS,
  maintainabilityRating: RATING_THRESHOLDS,
  securityIssues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
  securityHotspots: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
  reliabilityIssues: {
    rules: [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-5' },
      { key: 'error', expression: '>5' },
    ],
  },
  maintainabilityIssues: {
    rules: [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
  },
  codeCoverage: {
    rules: [
      { key: 'success', expression: '>80' },
      { key: 'warning', expression: '50-80' },
      { key: 'error', expression: '<50' },
    ],
  },
  codeDuplications: {
    rules: [
      { key: 'success', expression: '<3' },
      { key: 'warning', expression: '3-10' },
      { key: 'error', expression: '>10' },
    ],
  },
};
