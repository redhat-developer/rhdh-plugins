# Resource Optimization Plugin E2E Tests

This directory contains end-to-end tests for the Resource Optimization plugin using Playwright.

## Structure

```
e2e-tests/
├── fixtures/
│   └── optimizationResponses.ts    # Mock data for API responses
├── pages/
│   └── ResourceOptimizationPage.ts # Page object for optimization UI
├── utils/
│   ├── devMode.ts                  # Mock utilities for development mode
│   └── apiUtils.ts                 # General API testing utilities
├── app.test.ts                     # Basic app functionality test
├── optimization.test.ts            # Comprehensive optimization plugin tests
└── README.md                       # This file
```

## Mock Utilities

### Development Mode vs Production Mode

The tests automatically detect the environment:

- **Development Mode** (`!process.env.PLAYWRIGHT_URL`): Uses mocks for all API calls
- **Production Mode** (`process.env.PLAYWRIGHT_URL`): Uses real API endpoints

### Using Mock Utilities

```typescript
import {
  setupOptimizationMocks,
  mockOptimizationsResponse,
} from './utils/devMode';

test.beforeEach(async ({ page }) => {
  if (devMode) {
    // Setup all mocks at once
    await setupOptimizationMocks(page);

    // Or setup specific mocks
    await mockOptimizationsResponse(page, customOptimizations);
  }
});
```

### Available Mock Functions

#### `devMode.ts`

- `setupOptimizationMocks(page)` - Setup all mocks for basic testing
- `mockClustersResponse(page, clusters)` - Mock clusters API
- `mockOptimizationsResponse(page, optimizations, status)` - Mock optimizations API
- `mockEmptyOptimizationsResponse(page)` - Mock empty optimizations
- `mockWorkflowExecutionResponse(page, execution, status)` - Mock workflow execution
- `mockAuthTokenResponse(page, token)` - Mock authentication
- `mockAccessCheckResponse(page, hasAccess)` - Mock access check
- `mockAuthGuestRefreshResponse(page)` - Mock guest token refresh
- `mockPermissionResponse(page, hasPermission)` - Mock permission checks
- `mockCostManagementResponse(page, data)` - Mock cost management API
- `mockEmptyCostManagementResponse(page)` - Mock empty cost management data
- `mockCostManagementErrorResponse(page, status)` - Mock cost management errors

#### `apiUtils.ts`

- `waitUntilApiCallSucceeds(page, urlPart)` - Wait for API success
- `mockApiEndpoint(page, urlPattern, responseData, status)` - Generic API mock
- `mockApiError(page, urlPattern, errorMessage, status)` - Mock API errors
- `verifyApiCallMade(page, urlPattern, method)` - Verify API calls

## Page Objects

### ResourceOptimizationPage

Encapsulates all interactions with the optimization plugin UI:

```typescript
const optimizationPage = new ResourceOptimizationPage(page);

// Navigation
await optimizationPage.navigateToOptimization();

// Cluster selection
await optimizationPage.selectCluster('Production Cluster');

// View optimizations
await optimizationPage.viewOptimizations();

// Apply recommendations
await optimizationPage.applyRecommendation('opt-1');

// Verify states
await optimizationPage.verifyOptimizationDisplayed(optimization);
await optimizationPage.expectEmptyState();
await optimizationPage.expectErrorState();
```

## Test Data

### Mock Data Structure

The `fixtures/optimizationResponses.ts` file contains realistic mock data:

```typescript
export const mockOptimizations = [
  {
    id: 'opt-1',
    clusterId: 'cluster-1',
    workloadName: 'frontend-deployment',
    resourceType: 'CPU',
    currentValue: '2000m',
    recommendedValue: '1000m',
    savings: { cost: 45.5 },
    status: 'pending',
    severity: 'medium',
    // ... more fields
  },
  // ... more optimizations
];
```

## Running Tests

### Local Development

```bash
# Run all tests
yarn test:e2e

# Run specific test file
yarn playwright test optimization.test.ts

# Run with UI
yarn test:e2e:ui

# Run in headed mode
yarn test:e2e:headed
```

### CI Environment

Tests automatically run in CI when changes are made to the optimization plugin workspace.

## Environment Variables

For production mode testing, set these environment variables:

```bash
export PLAYWRIGHT_URL=http://localhost:3000
export RHHCC_SA_CLIENT_ID=your-client-id
export RHHCC_SA_CLIENT_SECRET=your-client-secret
```

## Writing New Tests

1. **Use page objects** for UI interactions
2. **Mock API calls** in development mode
3. **Test both success and error scenarios**
4. **Validate accessibility** with proper ARIA labels
5. **Use descriptive test names** that explain the user journey

### Example Test Structure

```typescript
test('should handle optimization workflow', async ({ page }) => {
  // Setup
  if (devMode) {
    await mockOptimizationsResponse(page, testOptimizations);
    await mockWorkflowExecutionResponse(page, successExecution);
  }

  // Action
  await optimizationPage.navigateToOptimization();
  await optimizationPage.selectCluster('test-cluster');
  await optimizationPage.viewOptimizations();
  await optimizationPage.applyRecommendation('opt-1');

  // Verification
  await optimizationPage.expectWorkflowSuccess();
});
```

## Configuration

The plugin requires these configurations in `app-config.yaml`:

```yaml
proxy:
  endpoints:
    '/cost-management/v1':
      target: https://console.redhat.com/api/cost-management/v1
      allowedHeaders: ['Authorization']
      credentials: dangerously-allow-unauthenticated

resourceOptimization:
  clientId: ${RHHCC_SA_CLIENT_ID}
  clientSecret: ${RHHCC_SA_CLIENT_SECRET}
  optimizationWorkflowId: 'patch-k8s-resource'
```
