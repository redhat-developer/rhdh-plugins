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

import type { Page } from '@playwright/test';
import { mockApiResponse } from './apiUtils';
import { ScorecardRoutes } from '../constants/routes';
import {
  githubAggregatedResponse,
  jiraAggregatedResponse,
  notAllowedAggregationErrorBody,
  openIssuesKpiMetadataResponse,
  openPrsKpiMetadataResponse,
} from './scorecardResponseUtils';

function aggregationMetadataForRequestUrl(url: string): object {
  if (url.includes('openIssuesKpi')) {
    return openIssuesKpiMetadataResponse;
  }
  if (url.includes('openPrsKpi')) {
    return openPrsKpiMetadataResponse;
  }
  if (url.includes('jira.open_issues')) {
    return jiraAggregatedResponse.metadata;
  }
  if (url.includes('github.open_prs')) {
    return githubAggregatedResponse.metadata;
  }
  return openPrsKpiMetadataResponse;
}

/**
 * Forces aggregation data requests to 403 (NotAllowedError in body) while metadata
 * requests succeed so ErrorStatePanel can render titles (matches homepage error UX).
 */
export async function mockHomepageAggregationsPermissionDenied(
  page: Page,
): Promise<void> {
  await page.route('**/api/scorecard/aggregations/**', async route => {
    const url = route.request().url();
    if (url.includes('/metadata')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(aggregationMetadataForRequestUrl(url)),
      });
      return;
    }
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify(notAllowedAggregationErrorBody),
    });
  });
}

/**
 * Mocks all four default homepage scorecard aggregation KPI endpoints
 * so the full grid can load without hitting the real backend.
 */
export async function mockAllDefaultHomepageAggregationsSuccess(
  page: Page,
): Promise<void> {
  await mockApiResponse(
    page,
    ScorecardRoutes.JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE,
    jiraAggregatedResponse,
  );
  await mockApiResponse(
    page,
    ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE,
    githubAggregatedResponse,
  );
  await mockApiResponse(
    page,
    ScorecardRoutes.OPEN_ISSUES_KPI_AGGREGATION_ROUTE,
    jiraAggregatedResponse,
  );
  await mockApiResponse(
    page,
    ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
    githubAggregatedResponse,
  );
}
