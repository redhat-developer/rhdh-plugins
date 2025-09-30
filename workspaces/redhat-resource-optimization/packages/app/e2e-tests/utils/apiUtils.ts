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

/**
 * Wait for a specific API call to succeed
 */
export async function waitUntilApiCallSucceeds(
  page: Page,
  urlPart: string = '/api/redhat-resource-optimization',
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

/**
 * Wait for optimization API call to complete
 */
export async function waitForOptimizationApiCall(page: Page): Promise<void> {
  await waitUntilApiCallSucceeds(
    page,
    '/api/redhat-resource-optimization/optimizations',
  );
}

/**
 * Wait for clusters API call to complete
 */
export async function waitForClustersApiCall(page: Page): Promise<void> {
  await waitUntilApiCallSucceeds(
    page,
    '/api/redhat-resource-optimization/clusters',
  );
}

/**
 * Wait for workflow execution API call to complete
 */
export async function waitForWorkflowApiCall(page: Page): Promise<void> {
  await waitUntilApiCallSucceeds(
    page,
    '/api/redhat-resource-optimization/workflow',
  );
}

/**
 * Mock any API endpoint with custom response
 */
export async function mockApiEndpoint(
  page: Page,
  urlPattern: string,
  responseData: any,
  status = 200,
) {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Mock API endpoint with error response
 */
export async function mockApiError(
  page: Page,
  urlPattern: string,
  errorMessage = 'Internal Server Error',
  status = 500,
) {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        error: errorMessage,
        status,
        timestamp: new Date().toISOString(),
      }),
    });
  });
}

/**
 * Mock network failure for an endpoint
 */
export async function mockNetworkFailure(page: Page, urlPattern: string) {
  await page.route(urlPattern, async route => {
    await route.abort('failed');
  });
}

/**
 * Verify API call was made
 */
export async function verifyApiCallMade(
  page: Page,
  urlPattern: string,
  method = 'GET',
): Promise<boolean> {
  try {
    await page.waitForResponse(
      async res => {
        return (
          res.url().includes(urlPattern) && res.request().method() === method
        );
      },
      { timeout: 10000 },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get API response data
 */
export async function getApiResponseData(
  page: Page,
  urlPattern: string,
): Promise<any> {
  const response = await page.waitForResponse(
    async res => res.url().includes(urlPattern),
    { timeout: 10000 },
  );

  return await response.json();
}

/**
 * Track if a route mock was called
 */
interface MockCallTracker {
  called: boolean;
  count: number;
  requests: Array<{ url: string; method: string; body?: any }>;
}

/**
 * Create a tracked mock route that records when it's called.
 * Returns a tracker object that can be verified later.
 */
export async function createTrackedMock(
  page: Page,
  urlPattern: string,
  responseData: any,
  status = 200,
): Promise<MockCallTracker> {
  const tracker: MockCallTracker = {
    called: false,
    count: 0,
    requests: [],
  };

  await page.route(urlPattern, async route => {
    tracker.called = true;
    tracker.count++;
    tracker.requests.push({
      url: route.request().url(),
      method: route.request().method(),
      body: route.request().postDataJSON(),
    });

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });

  return tracker;
}

/**
 * Verify that a mock was actually called during the test.
 * Throws an error if the mock was never called.
 */
export function verifyMockWasCalled(
  tracker: MockCallTracker,
  mockName: string,
) {
  if (!tracker.called) {
    throw new Error(
      `Expected ${mockName} mock to be called, but it was never invoked`,
    );
  }
  if (tracker.count === 0) {
    throw new Error(`Expected ${mockName} to be called at least once`);
  }
  expect(tracker.called).toBe(true);
  expect(tracker.count).toBeGreaterThan(0);
}

/**
 * Wait for a specific request to be made and verify it was mocked.
 */
export async function waitForMockedRequest(
  page: Page,
  urlPattern: string,
  timeout = 10000,
): Promise<void> {
  await page.waitForRequest(
    request => {
      const url = request.url();
      return url.includes(urlPattern);
    },
    { timeout },
  );
}

/**
 * Verify that a response matches expected mock data.
 */
export async function verifyMockedResponse(
  page: Page,
  urlPattern: string,
  expectedData: any,
  timeout = 10000,
): Promise<void> {
  const response = await page.waitForResponse(
    res => res.url().includes(urlPattern),
    { timeout },
  );

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toMatchObject(expectedData);
}
