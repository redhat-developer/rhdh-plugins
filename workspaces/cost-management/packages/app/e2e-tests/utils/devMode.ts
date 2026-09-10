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

import { Page } from '@playwright/test';
import {
  optimizationBaseUrl,
  mockClusters,
  mockOptimizations,
  mockOptimizationsEmpty,
  mockOptimizationsError,
  mockWorkflowExecution,
  mockWorkflowExecutionError,
} from '../fixtures/optimizationResponses';
import { setupAuthMocks } from '../fixtures/auth';

/**
 * Mock clusters API endpoint
 */
export async function mockClustersResponse(
  page: Page,
  clusters = mockClusters,
) {
  await page.route(`${optimizationBaseUrl}/clusters`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ clusters }),
    });
  });
}

/**
 * Mock optimizations API endpoint
 */
export async function mockOptimizationsResponse(
  page: Page,
  optimizations = mockOptimizations,
  status = 200,
) {
  // Mock the actual API endpoint that's being called
  await page.route(
    '**/api/proxy/cost-management/v1/recommendations/openshift*',
    async route => {
      if (status === 200) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: optimizations,
            meta: {
              count: optimizations.length,
              limit: 10,
              offset: 0,
            },
          }),
        });
      } else {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(mockOptimizationsError),
        });
      }
    },
  );

  // Also mock the old endpoint for backward compatibility
  await page.route(`${optimizationBaseUrl}/optimizations*`, async route => {
    if (status === 200) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ optimizations }),
      });
    } else {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(mockOptimizationsError),
      });
    }
  });
}

/**
 * Mock empty optimizations response
 */
export async function mockEmptyOptimizationsResponse(page: Page) {
  await mockOptimizationsResponse(page, mockOptimizationsEmpty);
}

/**
 * Mock workflow execution API endpoint
 */
export async function mockWorkflowExecutionResponse(
  page: Page,
  execution = mockWorkflowExecution,
  status = 200,
) {
  await page.route(`${optimizationBaseUrl}/workflow/execute`, async route => {
    if (status === 200) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(execution),
      });
    } else {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(mockWorkflowExecutionError),
      });
    }
  });
}

/**
 * Mock workflow execution error response
 */
export async function mockWorkflowExecutionErrorResponse(page: Page) {
  await mockWorkflowExecutionResponse(page, mockWorkflowExecutionError, 500);
}

/**
 * Mock authentication token endpoint
 */
export async function mockAuthTokenResponse(
  page: Page,
  token = 'mock-access-token',
) {
  await page.route(`${optimizationBaseUrl}/token`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: token }),
    });
  });
}

/**
 * Mock access check endpoint
 */
export async function mockAccessCheckResponse(page: Page, hasAccess = true) {
  await page.route(`${optimizationBaseUrl}/access`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasAccess }),
    });
  });
}

/**
 * Mock permission check endpoint with custom permission settings
 * Note: For standard auth mocking, use setupAuthMocks() from fixtures/auth.ts
 */
export async function mockPermissionResponse(page: Page, hasPermission = true) {
  await page.route('**/api/permission/**', async route => {
    if (hasPermission) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: 'ALLOW',
          conditions: [],
        }),
      });
    } else {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          result: 'DENY',
          message: 'Insufficient permissions',
        }),
      });
    }
  });
}

/**
 * Mock cost management API endpoints
 */
export async function mockCostManagementResponse(
  page: Page,
  data = mockOptimizations,
) {
  // IMPORTANT: Register routes in specific order (Playwright checks in reverse)

  // 1. Catch-all route (checked LAST)
  await page.route('**/api/proxy/cost-management/v1/**', async route => {
    const url = route.request().url();
    // Skip if this is the recommendations endpoint - let specific handlers handle it
    if (url.includes('/recommendations/openshift')) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        meta: { count: 0 },
      }),
    });
  });

  // 2. Mock individual recommendation details endpoint (e.g., /recommendations/openshift/rec-001)
  await page.route(
    /\/api\/proxy\/cost-management\/v1\/recommendations\/openshift\/rec-\d+/,
    async route => {
      const url = route.request().url();
      // Extract the recommendation ID from the URL
      const match = url.match(/\/rec-(\d+)/);
      const recId = match ? `rec-${match[1]}` : 'rec-001';

      // Find the matching recommendation from our mock data
      const recommendation = data.find((item: any) => item.id === recId);

      if (recommendation) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(recommendation),
        });
      } else {
        // Return first item as fallback
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data[0] || {}),
        });
      }
    },
  );

  // 3. Mock the main recommendations list endpoint (checked FIRST after individual)
  await page.route(
    /\/api\/proxy\/cost-management\/v1\/recommendations\/openshift$/,
    async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: data,
          meta: {
            count: data.length,
            limit: 10,
            offset: 0,
            total: data.length,
          },
        }),
      });
    },
  );
}

/**
 * Mock empty cost management response
 */
export async function mockEmptyCostManagementResponse(page: Page) {
  await mockCostManagementResponse(page, []);
}

/**
 * Mock cost management error response
 */
export async function mockCostManagementErrorResponse(
  page: Page,
  status = 500,
) {
  await page.route('**/api/proxy/cost-management/v1/**', async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Cost management service unavailable',
        message: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      }),
    });
  });
}

/**
 * Setup all mocks for development mode.
 * IMPORTANT: Call this BEFORE any page navigation to ensure mocks are in place.
 *
 * NOTE: We do NOT mock authentication endpoints - the real guest auth flow works fine.
 * Mocking auth actually breaks it since the app expects the real backend auth to work.
 */
export async function setupOptimizationMocks(page: Page) {
  // DON'T mock auth - let the real guest authentication work
  // await setupAuthMocks(page);

  // Permission and access mocks (optional - may not be needed)
  // await mockAccessCheckResponse(page);

  // API mocks for the resource optimization plugin data
  await mockClustersResponse(page);
  await mockAuthTokenResponse(page);
  await mockWorkflowExecutionResponse(page);
  await mockCostManagementResponse(page); // This includes the optimizations data

  // Wait a bit to ensure all routes are registered
  await page.waitForTimeout(100);
}
