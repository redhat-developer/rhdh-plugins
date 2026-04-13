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
import { Page, expect } from '@playwright/test';
import { ScorecardRoutes } from '../constants/routes';

/** Metric-id aggregation URLs (drill-down uses `github.open_prs` / `jira.open_issues`). */
const GITHUB_AGGREGATION_ROUTE =
  ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE;
const JIRA_AGGREGATION_ROUTE =
  ScorecardRoutes.JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE;

export async function waitUntilApiCallSucceeds(
  page: Page,
  urlPart: string = '/api/scorecard/metrics/catalog/Component/default/red-hat-developer-hub',
): Promise<void> {
  const response = await page.waitForResponse(
    async res => {
      const urlMatches = res.url().includes(urlPart);
      const isSuccess = res.status() === 200;
      return urlMatches && isSuccess;
    },
    { timeout: 60000 },
  );

  expect(response.status()).toBe(200);
}

export async function mockApiResponse(
  page: Page,
  route: string,
  responseData: object,
  status = 200,
) {
  await page.route(route, async r => {
    await r.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/** Non-JSON error bodies (e.g. metadata endpoint 500). */
export async function mockApiTextResponse(
  page: Page,
  route: string,
  body: string,
  status = 500,
) {
  await page.route(route, async r => {
    await r.fulfill({
      status,
      contentType: 'text/plain',
      body,
    });
  });
}

/** Mocks only the GitHub aggregations API (for tests that only load the GitHub card/drill-down). */
export async function mockGitHubAggregationResponse(
  page: Page,
  githubResponse: object,
  status = 200,
) {
  await page.route(GITHUB_AGGREGATION_ROUTE, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(githubResponse),
    });
  });
}

/** Mocks only the Jira aggregations API (for tests that only load the Jira drill-down page). */
export async function mockJiraAggregationResponse(
  page: Page,
  jiraResponse: object,
  status = 200,
) {
  await page.route(JIRA_AGGREGATION_ROUTE, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(jiraResponse),
    });
  });
}

const entitiesDrillDownPattern = (metricId: string) =>
  `**/api/scorecard/metrics/${metricId}/catalog/aggregations/entities*`;

/** Dummy 403 body for permission-denied responses (no sensitive paths). */
const notAllowedError403Body = (requestUrl: string) =>
  JSON.stringify({
    error: {
      name: 'NotAllowedError',
      message: '',
      stack: 'NotAllowedError\n    at authorizeConditional (router.ts:92:13)',
    },
    request: { method: 'GET', url: requestUrl },
    response: { statusCode: 403 },
  });

const METRICS_API_PATTERN = '**/api/scorecard/metrics*';

/**
 * Mocks GET /api/scorecard/metrics?metricIds={metricId} to return metric metadata (e.g. for drill-down page).
 */
export async function mockMetricsApi(
  page: Page,
  responseData: { metrics: object[] },
) {
  await page.route(METRICS_API_PATTERN, async route => {
    const url = route.request().url();
    if (!url.includes('metricIds=')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Mocks Jira drill-down "missing permission" scenario: metrics API 200, aggregations 403, entities 403.
 * Use with direct navigation to /scorecard/aggregations/jira.open_issues/metrics/jira.open_issues
 */
export async function mockJiraDrillDownMissingPermission(
  page: Page,
  metricsResponse: { metrics: object[] },
) {
  await mockMetricsApi(page, metricsResponse);
  await page.route(JIRA_AGGREGATION_ROUTE, async route => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: notAllowedError403Body(
        '/metrics/jira.open_issues/catalog/aggregations',
      ),
    });
  });
  await page.route(
    entitiesDrillDownPattern('jira.open_issues'),
    async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: notAllowedError403Body(
          '/metrics/jira.open_issues/catalog/aggregations/entities?page=1&pageSize=5',
        ),
      });
    },
  );
}

/**
 * Mocks the aggregated scorecard entity drill-down API:
 * GET /api/scorecard/metrics/{metricId}/catalog/aggregations/entities?page=1&pageSize=5
 */
export async function mockScorecardEntitiesDrillDown(
  page: Page,
  responseData: object,
  metricId: 'github.open_prs' | 'jira.open_issues' = 'github.open_prs',
  status = 200,
) {
  await page.route(entitiesDrillDownPattern(metricId), async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

const STATUS_ORDER_ASC = ['error', 'success', 'warning'];

interface EntitiesDrillDownPayload {
  entities?: Array<{ status?: string }>;
  metricId?: string;
  metricMetadata?: object;
  pagination?: object;
  [key: string]: unknown;
}

function sortEntitiesByStatus(
  data: EntitiesDrillDownPayload,
  sortOrder: 'asc' | 'desc',
): EntitiesDrillDownPayload {
  const entities = data.entities ? [...data.entities] : [];
  const order =
    sortOrder === 'asc' ? STATUS_ORDER_ASC : [...STATUS_ORDER_ASC].reverse();
  entities.sort((a, b) => {
    const aIdx = order.indexOf(a.status ?? '');
    const bIdx = order.indexOf(b.status ?? '');
    return aIdx - bIdx;
  });
  return { ...data, entities };
}

/**
 * Mocks the entities drill-down API:
 * - Reads page and pageSize from the request URL (defaults: page=1, pageSize=5)
 * - Sorts entities by status when sortBy=status and sortOrder are present
 * - Returns a slice of the existing response entities for the requested page
 */
export async function mockScorecardEntitiesDrillDownWithSort(
  page: Page,
  responseData: object,
  metricId: 'github.open_prs' | 'jira.open_issues' = 'github.open_prs',
  status = 200,
) {
  await page.route(entitiesDrillDownPattern(metricId), async route => {
    const url = new URL(route.request().url());
    const requestedPage = Math.max(
      1,
      parseInt(url.searchParams.get('page') ?? '1', 10),
    );
    const requestedPageSize = Math.max(
      1,
      parseInt(url.searchParams.get('pageSize') ?? '5', 10),
    );
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = (url.searchParams.get('sortOrder') ?? 'asc') as
      | 'asc'
      | 'desc';

    let payload = responseData as EntitiesDrillDownPayload;
    if (sortBy === 'status') {
      payload = sortEntitiesByStatus(payload, sortOrder);
    }
    const entities = payload.entities ? [...payload.entities] : [];

    const total = entities.length;
    const start = (requestedPage - 1) * requestedPageSize;
    const slicedEntities = entities.slice(start, start + requestedPageSize);
    const totalPages = Math.ceil(total / requestedPageSize) || 1;

    const data: EntitiesDrillDownPayload = {
      ...payload,
      entities: slicedEntities,
      pagination: {
        page: requestedPage,
        pageSize: requestedPageSize,
        total,
        totalPages,
        isCapped: false,
      },
    };

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}
