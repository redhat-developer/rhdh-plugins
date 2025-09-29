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

export const optimizationBaseUrl = '**/api/redhat-resource-optimization';

export const mockClusters = [
  {
    id: 'cluster-1',
    name: 'production-cluster',
    displayName: 'Production Cluster',
    status: 'active',
    region: 'us-east-1',
  },
  {
    id: 'cluster-2',
    name: 'staging-cluster',
    displayName: 'Staging Cluster',
    status: 'active',
    region: 'us-west-2',
  },
];

export const mockOptimizations = [
  {
    id: 'opt-1',
    clusterId: 'cluster-1',
    clusterName: 'production-cluster',
    namespace: 'default',
    workloadName: 'frontend-deployment',
    workloadType: 'Deployment',
    resourceType: 'CPU',
    currentValue: '2000m',
    recommendedValue: '1000m',
    savings: {
      cpu: '1000m',
      memory: '0Mi',
      cost: 45.5,
    },
    status: 'pending',
    severity: 'medium',
    description: 'CPU requests are higher than actual usage',
    recommendation: 'Reduce CPU requests to match actual usage patterns',
    lastAnalyzed: '2024-01-15T10:30:00Z',
  },
  {
    id: 'opt-2',
    clusterId: 'cluster-1',
    clusterName: 'production-cluster',
    namespace: 'backend',
    workloadName: 'api-server',
    workloadType: 'Deployment',
    resourceType: 'Memory',
    currentValue: '2Gi',
    recommendedValue: '1.5Gi',
    savings: {
      cpu: '0m',
      memory: '500Mi',
      cost: 23.75,
    },
    status: 'pending',
    severity: 'low',
    description: 'Memory requests can be optimized',
    recommendation: 'Adjust memory requests based on peak usage',
    lastAnalyzed: '2024-01-15T10:25:00Z',
  },
];

export const mockOptimizationsEmpty = [];

export const mockOptimizationsError = {
  error: 'Unable to fetch optimization data',
  message: 'Service temporarily unavailable',
  code: 'SERVICE_UNAVAILABLE',
};

export const mockWorkflowExecution = {
  executionId: 'exec-123',
  status: 'completed',
  result: 'success',
  message: 'Optimization applied successfully',
  timestamp: '2024-01-15T11:00:00Z',
};

export const mockWorkflowExecutionError = {
  executionId: 'exec-124',
  status: 'failed',
  result: 'error',
  message: 'Failed to apply optimization: insufficient permissions',
  timestamp: '2024-01-15T11:05:00Z',
};

// Additional mock data for more comprehensive testing
export const mockOptimizationsWithMoreData = [
  ...mockOptimizations,
  {
    id: 'opt-3',
    clusterId: 'cluster-2',
    clusterName: 'staging-cluster',
    namespace: 'test',
    workloadName: 'database-pod',
    workloadType: 'Pod',
    resourceType: 'CPU',
    currentValue: '500m',
    recommendedValue: '300m',
    savings: {
      cpu: '200m',
      memory: '0Mi',
      cost: 12.25,
    },
    status: 'pending',
    severity: 'high',
    description: 'High CPU requests for database workload',
    recommendation: 'Optimize CPU requests based on actual usage',
    lastAnalyzed: '2024-01-15T09:15:00Z',
  },
  {
    id: 'opt-4',
    clusterId: 'cluster-1',
    clusterName: 'production-cluster',
    namespace: 'monitoring',
    workloadName: 'prometheus-server',
    workloadType: 'StatefulSet',
    resourceType: 'Memory',
    currentValue: '4Gi',
    recommendedValue: '3Gi',
    savings: {
      cpu: '0m',
      memory: '1Gi',
      cost: 67.8,
    },
    status: 'applied',
    severity: 'medium',
    description: 'Memory optimization for monitoring stack',
    recommendation: 'Reduce memory allocation for Prometheus',
    lastAnalyzed: '2024-01-14T16:45:00Z',
  },
];

export const mockAuthResponse = {
  token: 'mock-access-token',
  expires_in: 3600,
  token_type: 'Bearer',
};

export const mockPermissionResponse = {
  result: 'ALLOW',
  conditions: [],
  resource: 'resource-optimization',
  action: 'read',
};

export const mockCostManagementMeta = {
  count: 4,
  limit: 10,
  offset: 0,
  total: 4,
  order_by: 'last_reported',
  order_how: 'desc',
};
