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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * Messages object containing all English translations.
 * This is our single source of truth for translations.
 * @public
 */
export const scorecardMessages = {
  // Empty state
  emptyState: {
    title: 'No scorecards added yet',
    description:
      'Scorecards help you monitor component health at a glance. To begin, explore our documentation for setup guidelines.',
    button: 'View documentation',
    altText: 'No scorecards',
  },

  // Not found state (404)
  notFound: {
    title: "404 We couldn't find that page",
    description:
      'Try adding an {{indexFile}} file in the root of the docs directory of this repository.',
    readMore: 'Read more',
    goBack: 'Go back',
    contactSupport: 'Contact support',
    altText: 'Page not found',
  },

  // Permission required state
  permissionRequired: {
    title: 'Missing permission',
    description:
      'To view Scorecard plugin, contact your administrator to give the {{permission}} permission.',
    button: 'Read more',
    altText: 'Permission required',
  },

  // Common UI
  common: {
    loading: 'Loading',
    current: 'current',
  },

  // Error messages
  errors: {
    entityMissingProperties:
      'Entity missing required properties for scorecard lookup',
    missingAggregationId:
      'Scorecard misconfigured, aggregation ID (or metric ID) property is not provided', // "or metric ID" will be removed in the future
    invalidApiResponse: 'Invalid response format from scorecard API',
    fetchError: 'Error fetching scorecards: {{error}}',
    metricDataUnavailable: 'Metric data unavailable',
    invalidThresholds: 'Invalid thresholds',
    missingPermission: 'Missing permission',
    noDataFound: 'No data found',
    authenticationError: 'Authentication error',
    missingPermissionMessage:
      'To view the scorecard metrics, your administrator must grant you the required permission.',
    userNotFoundInCatalogMessage: 'User entity not found in catalog.',
    noDataFoundMessage:
      'To see your data here, check that your entities are reporting values related to this metric.',
    unsupportedAggregationType:
      'This scorecard uses an aggregation type that is not supported by this version of the plugin.',
    authenticationErrorMessage: 'Please sign in to view your data.',
  },

  // Metric translations
  metric: {
    'dora.deploymentFrequency': {
      title: 'DORA - Deployment Frequency',
      description:
        'Tracks how often code is successfully deployed to production over the past 30 days. Elite performers deploy on demand (multiple times per day).',
    },
    'dora.medianLeadTimeForChanges': {
      title: 'DORA - Median Lead Time for Changes',
      description:
        'Measures the median time from code commit to production deployment over the past 30 days. Elite performers have a lead time of less than 24 hours.',
    },
    'dora.changeFailureRate': {
      title: 'DORA - Change Failure Rate',
      description:
        'Monitors the percentage of deployments that cause a failure in production over the past 30 days. Elite performers maintain a change failure rate below 5%.',
    },
    'dora.medianTimeToRestore': {
      title: 'DORA - Median Time to Restore',
      description:
        'Tracks the median time to restore service after an incident over the past 30 days. Elite performers restore service in under one hour.',
    },
    'github.openPRs': {
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
    },
    'gitlab.openIssues': {
      title: 'GitLab open issues',
      description: 'Current count of open issues for a given GitLab project.',
    },
    'gitlab.openedIssues7d': {
      title: 'GitLab issues opened (7d)',
      description:
        'Number of issues opened in the last 7 days for a given GitLab project.',
    },
    'gitlab.closedIssues7d': {
      title: 'GitLab issues closed (7d)',
      description:
        'Number of issues in closed state that were updated in the last 7 days for a given GitLab project.',
    },
    'gitlab.openMergeRequests': {
      title: 'GitLab open merge requests',
      description:
        'Current count of open merge requests for a given GitLab project.',
    },
    'gitlab.openedMergeRequests7d': {
      title: 'GitLab merge requests opened (7d)',
      description:
        'Number of merge requests opened in the last 7 days for a given GitLab project.',
    },
    'gitlab.closedMergeRequests7d': {
      title: 'GitLab merge requests closed (7d)',
      description:
        'Number of merge requests in closed or merged state that were updated in the last 7 days for a given GitLab project.',
    },
    'gitlab.startedPipelines7d': {
      title: 'GitLab pipelines started (7d)',
      description:
        'Number of pipelines started in the last 7 days for a given GitLab project.',
    },
    'gitlab.successfulPipelines7d': {
      title: 'GitLab successful pipelines (7d)',
      description:
        'Number of successfully finished pipelines in the last 7 days for a given GitLab project.',
    },
    'gitlab.failedPipelines7d': {
      title: 'GitLab failed pipelines (7d)',
      description:
        'Number of failed pipelines in the last 7 days for a given GitLab project.',
    },
    'gitlab.pipelineSuccessRatio7d': {
      title: 'GitLab pipeline success ratio (7d)',
      description:
        'Ratio of successful vs successful+failed pipelines in the last 7 days (percentage). Ignores pending, running, and canceled pipelines.',
    },
    'gitlab.pipelineSuccessRatio24h': {
      title: 'GitLab pipeline success ratio (24h)',
      description:
        'Ratio of successful vs successful+failed pipelines in the last 24 hours (percentage). Ignores pending, running, and canceled pipelines.',
    },
    'gitlab.startedJobs7d': {
      title: 'GitLab jobs started (7d)',
      description:
        'Number of jobs started in the last 7 days for a given GitLab project.',
    },
    'gitlab.successfulJobs7d': {
      title: 'GitLab successful jobs (7d)',
      description:
        'Number of successfully finished jobs in the last 7 days for a given GitLab project.',
    },
    'gitlab.failedJobs7d': {
      title: 'GitLab failed jobs (7d)',
      description:
        'Number of failed jobs in the last 7 days for a given GitLab project.',
    },
    'gitlab.jobSuccessRatio7d': {
      title: 'GitLab job success ratio (7d)',
      description:
        'Ratio of successful vs successful+failed jobs in the last 7 days (percentage). Ignores pending, running, and canceled jobs.',
    },
    'gitlab.jobSuccessRatio24h': {
      title: 'GitLab job success ratio (24h)',
      description:
        'Ratio of successful vs successful+failed jobs in the last 24 hours (percentage). Ignores pending, running, and canceled jobs.',
    },
    'jira.openIssues': {
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
    },
    'sonarqube.qualityGate': {
      title: 'SonarQube Quality Gate Status',
      description: 'Whether the project passes its SonarQube quality gate.',
    },
    'sonarqube.openIssues': {
      title: 'SonarQube Open Issues',
      description:
        'Count of open issues (OPEN, CONFIRMED, REOPENED) in SonarQube.',
    },
    'sonarqube.securityRating': {
      title: 'SonarQube Security Rating',
      description: 'SonarQube security rating.',
    },
    'sonarqube.securityIssues': {
      title: 'SonarQube Security Issues',
      description: 'Count of open security vulnerabilities in SonarQube.',
    },
    'sonarqube.securityReviewRating': {
      title: 'SonarQube Security Review Rating',
      description: 'SonarQube security review rating.',
    },
    'sonarqube.securityHotspots': {
      title: 'SonarQube Security Hotspots',
      description: 'Count of security hotspots to review in SonarQube.',
    },
    'sonarqube.reliabilityRating': {
      title: 'SonarQube Reliability Rating',
      description: 'SonarQube reliability rating.',
    },
    'sonarqube.reliabilityIssues': {
      title: 'SonarQube Reliability Issues',
      description: 'Count of open bugs in SonarQube.',
    },
    'sonarqube.maintainabilityRating': {
      title: 'SonarQube Maintainability Rating',
      description: 'SonarQube maintainability rating.',
    },
    'sonarqube.maintainabilityIssues': {
      title: 'SonarQube Maintainability Issues',
      description: 'Count of open code smells in SonarQube.',
    },
    'sonarqube.codeCoverage': {
      title: 'SonarQube Code Coverage',
      description: 'Overall code coverage percentage in SonarQube.',
    },
    'sonarqube.codeDuplications': {
      title: 'SonarQube Code Duplications',
      description: 'Percentage of duplicated lines in SonarQube.',
    },
    filecheck: {
      title: 'File check: {{name}}',
      description: 'Checks whether the {{name}} file exists in the repository.',
    },
    lastUpdated: 'Last updated: {{timestamp}}',
    lastUpdatedNotAvailable: 'Last updated: Not available',
    someEntitiesNotReportingValues:
      'Some entities are not reporting values related to this metric.',
    weightedStatusScoreCenterTooltipTotalLabel: 'Total score',
    weightedStatusScoreCenterTooltipMaxLabel: 'Max possible score',
    weightedStatusScoreCenterTooltipBreakdownRow_one:
      '{{status}}: {{count}} entity, score: {{score}}',
    weightedStatusScoreCenterTooltipBreakdownRow_other:
      '{{status}}: {{count}} entities, score: {{score}}',
    weightedStatusScoreLegendTooltipEntitiesEach_one:
      '{{count}} entity, each {{score}}',
    weightedStatusScoreLegendTooltipEntitiesEach_other:
      '{{count}} entities, each {{score}}',
    weightedStatusScoreLegendTooltipRowTotal: 'Total score {{total}}',
    drillDownCalculationFailures:
      'One or more entities failed while calculating this metric.',
    homepageEntityHealthRatio: '{{healthy}}/{{total}} entities',
    homepageEntityCalculationHealth:
      '{{healthy}} / {{total}} entities without metric calculation errors',
  },

  aggregation: {
    min: 'Min',
    max: 'Max',
    sum: 'Sum',
    count: 'Count',
    average: 'Average',
  },

  // Threshold translations
  thresholds: {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    elite: 'Elite',
    medium: 'Medium',
    low: 'Low',
    exist: 'Exist',
    missing: 'Missing',
    noEntities: 'No entities in {{category}} state',
    entities_one: '{{count}} entity',
    entities_other: '{{count}} entities',
  },

  // Data sources dialog
  dataSourcesDialog: {
    title: '{{title}} sources',
    close: 'Close',
    unknownPlugin: 'Unknown',
    statusTooltip:
      'Value {{value}} matches threshold {{status}} {{expression}}',
    collectorStatusTooltip:
      'This collector provides input data only. The {{metric}} check value is calculated from collectors and shown on the scorecard card.',
    collectorEmptyValue: '--',
    collectorUnavailableStatus: 'N/A',
    columns: {
      plugin: 'PLUGIN',
      check: 'CHECK',
      value: 'VALUE',
      status: 'STATUS',
      lastSynced: 'LAST SYNCED',
    },
  },

  // Card overflow menu
  card: {
    menuAriaLabel: 'More options',
    viewDataSources: 'View data sources',
  },

  // Entities page translations
  entitiesPage: {
    unknownMetric: 'Unknown metric',
    noDataFound:
      'To see your data here, check that your entities are reporting values related to this metric.',
    missingPermission:
      'To view the scorecard metrics, your administrator must grant you the required permission.',
    metricProviderNotRegistered:
      'Metric provider with ID {{metricId}} is not registered.',
    entitiesTable: {
      title: 'Entities',
      unavailable: 'Unavailable',
      titleWithCount: 'Entities ({{count}})',
      header: {
        status: 'Status',
        value: 'Value',
        entity: 'Entity',
        owner: 'Owner',
        kind: 'Kind',
        lastUpdated: 'Last updated',
      },
      footer: {
        allRows: 'All rows',
        rows_one: '{{count}} row',
        rows_other: '{{count}} rows',
        of: 'of',
      },
    },
  },
};

/**
 * Translation reference for scorecard plugin
 * @public
 */
export const scorecardTranslationRef = createTranslationRef({
  id: 'plugin.scorecard',
  messages: scorecardMessages,
});
