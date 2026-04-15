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

import { HomePageWidgetBlueprint } from '@backstage/plugin-home-react/alpha';
import type { RendererProps } from '@backstage/plugin-home-react';
import { ScorecardHomepageCard } from '../../components/ScorecardHomepageSection';

const defaultCardLayout = {
  width: {
    minColumns: 3,
    maxColumns: 12,
    defaultColumns: 4,
  },
  height: {
    minRows: 5,
    maxRows: 12,
    defaultRows: 6,
  },
} as const;

function AggregatedCardWithDeprecatedMetricIdContent() {
  return <ScorecardHomepageCard metricId="jira.open_issues" />;
}

function AggregatedCardWithDefaultAggregationContent() {
  return <ScorecardHomepageCard aggregationId="github.open_prs" />;
}

function AggregatedCardWithJiraOpenIssuesContent() {
  return <ScorecardHomepageCard aggregationId="openIssuesKpi" />;
}

function AggregatedCardWithGithubOpenPrsContent() {
  return <ScorecardHomepageCard aggregationId="openPrsKpi" />;
}

function AggregatedCardWithGithubFilesCheckLicenseContent() {
  return <ScorecardHomepageCard aggregationId="github.files_check.license" />;
}

function AggregatedCardWithGithubFilesCheckCodeownersContent() {
  return (
    <ScorecardHomepageCard aggregationId="github.files_check.codeowners" />
  );
}

function BorderlessHomeWidgetRenderer({ Content }: RendererProps) {
  return <Content />;
}

/**
 * NFS widget: AggregatedCardWithDeprecatedMetricId.
 * @alpha
 */
export const aggregatedCardWithDeprecatedMetricIdWidget =
  HomePageWidgetBlueprint.make({
    name: 'scorecard-deprecated-metric-id',
    params: {
      name: 'AggregatedCardWithDeprecatedMetricId',
      title: 'Scorecard: With deprecated metricId property (Jira)',
      layout: defaultCardLayout,
      componentProps: {
        Renderer: BorderlessHomeWidgetRenderer,
      },
      components: () =>
        Promise.resolve({
          Content: AggregatedCardWithDeprecatedMetricIdContent,
        }),
    },
  });

/**
 * NFS widget: AggregatedCardWithDefaultAggregation.
 * @alpha
 */
export const aggregatedCardWithDefaultAggregationWidget =
  HomePageWidgetBlueprint.make({
    name: 'scorecard-default-aggregation',
    params: {
      name: 'AggregatedCardWithDefaultAggregation',
      title: 'Scorecard: With default aggregation config (GitHub)',
      layout: defaultCardLayout,
      componentProps: {
        Renderer: BorderlessHomeWidgetRenderer,
      },
      components: () =>
        Promise.resolve({
          Content: AggregatedCardWithDefaultAggregationContent,
        }),
    },
  });

/**
 * NFS widget: AggregatedCardWithJiraOpenIssues.
 * @alpha
 */
export const aggregatedCardWithJiraOpenIssuesWidget =
  HomePageWidgetBlueprint.make({
    name: 'scorecard-jira-open-issues',
    params: {
      name: 'AggregatedCardWithJiraOpenIssues',
      title: 'Scorecard: Jira open blocking tickets',
      layout: defaultCardLayout,
      componentProps: {
        Renderer: BorderlessHomeWidgetRenderer,
      },
      components: () =>
        Promise.resolve({
          Content: AggregatedCardWithJiraOpenIssuesContent,
        }),
    },
  });

/**
 * NFS widget: AggregatedCardWithGithubOpenPrs.
 * @alpha
 */
export const aggregatedCardWithGithubOpenPrsWidget =
  HomePageWidgetBlueprint.make({
    name: 'scorecard-github-open-prs',
    params: {
      name: 'AggregatedCardWithGithubOpenPrs',
      title: 'Scorecard: GitHub open PRs',
      layout: defaultCardLayout,
      componentProps: {
        Renderer: BorderlessHomeWidgetRenderer,
      },
      components: () =>
        Promise.resolve({
          Content: AggregatedCardWithGithubOpenPrsContent,
        }),
    },
  });

/**
 * NFS widget: AggregatedCardWithGithubFilesCheckLicense.
 * @alpha
 */
export const aggregatedCardWithGithubFilesCheckLicenseWidget =
  HomePageWidgetBlueprint.make({
    name: 'scorecard-github-files-check-license',
    params: {
      name: 'AggregatedCardWithGithubFilesCheckLicense',
      title: 'Scorecard: LICENSE file exists',
      layout: defaultCardLayout,
      componentProps: {
        Renderer: BorderlessHomeWidgetRenderer,
      },
      components: () =>
        Promise.resolve({
          Content: AggregatedCardWithGithubFilesCheckLicenseContent,
        }),
    },
  });

/**
 * NFS widget: AggregatedCardWithGithubFilesCheckCodeowners.
 * @alpha
 */
export const aggregatedCardWithGithubFilesCheckCodeownersWidget =
  HomePageWidgetBlueprint.make({
    name: 'scorecard-github-files-check-codeowners',
    params: {
      name: 'AggregatedCardWithGithubFilesCheckCodeowners',
      title: 'Scorecard: CODEOWNERS file exists',
      layout: defaultCardLayout,
      componentProps: {
        Renderer: BorderlessHomeWidgetRenderer,
      },
      components: () =>
        Promise.resolve({
          Content: AggregatedCardWithGithubFilesCheckCodeownersContent,
        }),
    },
  });
