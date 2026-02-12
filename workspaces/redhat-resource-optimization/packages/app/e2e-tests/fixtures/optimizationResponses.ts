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
    id: 'rec-001',
    clusterAlias: 'production-cluster',
    clusterUuid: 'cluster-uuid-001',
    container: 'frontend-app',
    project: 'ecommerce',
    workload: 'frontend-deployment',
    workloadType: 'Deployment',
    lastReported: '2024-01-15T10:30:00Z',
    sourceId: 'source-001',
    recommendations: {
      current: {
        limits: {
          cpu: { amount: 2.0, format: 'cores' },
          memory: { amount: 4.0, format: 'GiB' },
        },
        requests: {
          cpu: { amount: 1.0, format: 'cores' },
          memory: { amount: 2.0, format: 'GiB' },
        },
      },
      recommendationTerms: {
        short_term: {
          monitoring_end_time: '2024-01-15T10:30:00Z',
          duration_in_hours: 24.0,
          notifications: {
            '112101': {
              type: 'notice',
              message: 'Cost Optimization Available',
              code: 112101,
            },
          },
          recommendation_engines: {
            cost: {
              config: {
                limits: {
                  cpu: { amount: 1.5, format: 'cores' },
                  memory: { amount: 3.0, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: 0.75, format: 'cores' },
                  memory: { amount: 1.5, format: 'GiB' },
                },
              },
              variation: {
                limits: {
                  cpu: { amount: -0.5, format: 'cores' },
                  memory: { amount: -1.0, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: -0.25, format: 'cores' },
                  memory: { amount: -0.5, format: 'GiB' },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    id: 'rec-002',
    clusterAlias: 'production-cluster',
    clusterUuid: 'cluster-uuid-001',
    container: 'api-server',
    project: 'backend-services',
    workload: 'api-deployment',
    workloadType: 'Deployment',
    lastReported: '2024-01-15T10:25:00Z',
    sourceId: 'source-002',
    recommendations: {
      current: {
        limits: {
          cpu: { amount: 1.0, format: 'cores' },
          memory: { amount: 2.0, format: 'GiB' },
        },
        requests: {
          cpu: { amount: 0.5, format: 'cores' },
          memory: { amount: 1.0, format: 'GiB' },
        },
      },
      recommendationTerms: {
        short_term: {
          monitoring_end_time: '2024-01-15T10:25:00Z',
          duration_in_hours: 24.0,
          notifications: {
            '112101': {
              type: 'notice',
              message: 'Cost Optimization Available',
              code: 112101,
            },
          },
          recommendation_engines: {
            cost: {
              config: {
                limits: {
                  cpu: { amount: 0.75, format: 'cores' },
                  memory: { amount: 1.5, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: 0.375, format: 'cores' },
                  memory: { amount: 0.75, format: 'GiB' },
                },
              },
              variation: {
                limits: {
                  cpu: { amount: -0.25, format: 'cores' },
                  memory: { amount: -0.5, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: -0.125, format: 'cores' },
                  memory: { amount: -0.25, format: 'GiB' },
                },
              },
            },
          },
        },
      },
    },
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
    id: 'rec-003',
    clusterAlias: 'staging-cluster',
    clusterUuid: 'cluster-uuid-002',
    container: 'database',
    project: 'data-platform',
    workload: 'postgres-statefulset',
    workloadType: 'StatefulSet',
    lastReported: '2024-01-15T09:15:00Z',
    sourceId: 'source-003',
    recommendations: {
      current: {
        limits: {
          cpu: { amount: 4.0, format: 'cores' },
          memory: { amount: 8.0, format: 'GiB' },
        },
        requests: {
          cpu: { amount: 2.0, format: 'cores' },
          memory: { amount: 4.0, format: 'GiB' },
        },
      },
      recommendationTerms: {
        short_term: {
          monitoring_end_time: '2024-01-15T09:15:00Z',
          duration_in_hours: 24.0,
          notifications: {
            '112101': {
              type: 'notice',
              message: 'Cost Optimization Available',
              code: 112101,
            },
          },
          recommendation_engines: {
            cost: {
              config: {
                limits: {
                  cpu: { amount: 3.0, format: 'cores' },
                  memory: { amount: 6.0, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: 1.5, format: 'cores' },
                  memory: { amount: 3.0, format: 'GiB' },
                },
              },
              variation: {
                limits: {
                  cpu: { amount: -1.0, format: 'cores' },
                  memory: { amount: -2.0, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: -0.5, format: 'cores' },
                  memory: { amount: -1.0, format: 'GiB' },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    id: 'rec-004',
    clusterAlias: 'production-cluster',
    clusterUuid: 'cluster-uuid-001',
    container: 'nginx',
    project: 'web-services',
    workload: 'nginx-deployment',
    workloadType: 'Deployment',
    lastReported: '2024-01-14T16:45:00Z',
    sourceId: 'source-004',
    recommendations: {
      current: {
        limits: {
          cpu: { amount: 0.5, format: 'cores' },
          memory: { amount: 512.0, format: 'MiB' },
        },
        requests: {
          cpu: { amount: 0.25, format: 'cores' },
          memory: { amount: 256.0, format: 'MiB' },
        },
      },
      recommendationTerms: {
        short_term: {
          monitoring_end_time: '2024-01-14T16:45:00Z',
          duration_in_hours: 24.0,
          notifications: {
            '112101': {
              type: 'notice',
              message: 'Cost Optimization Available',
              code: 112101,
            },
          },
          recommendation_engines: {
            cost: {
              config: {
                limits: {
                  cpu: { amount: 0.3, format: 'cores' },
                  memory: { amount: 384.0, format: 'MiB' },
                },
                requests: {
                  cpu: { amount: 0.15, format: 'cores' },
                  memory: { amount: 192.0, format: 'MiB' },
                },
              },
              variation: {
                limits: {
                  cpu: { amount: -0.2, format: 'cores' },
                  memory: { amount: -128.0, format: 'MiB' },
                },
                requests: {
                  cpu: { amount: -0.1, format: 'cores' },
                  memory: { amount: -64.0, format: 'MiB' },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    id: 'rec-005',
    clusterAlias: 'staging-cluster',
    clusterUuid: 'cluster-uuid-002',
    container: 'redis',
    project: 'cache-services',
    workload: 'redis-statefulset',
    workloadType: 'StatefulSet',
    lastReported: '2024-01-15T11:00:00Z',
    sourceId: 'source-005',
    recommendations: {
      current: {
        limits: {
          cpu: { amount: 1.0, format: 'cores' },
          memory: { amount: 2.0, format: 'GiB' },
        },
        requests: {
          cpu: { amount: 0.5, format: 'cores' },
          memory: { amount: 1.0, format: 'GiB' },
        },
      },
      recommendationTerms: {
        short_term: {
          monitoring_end_time: '2024-01-15T11:00:00Z',
          duration_in_hours: 24.0,
          notifications: {
            '112101': {
              type: 'notice',
              message: 'Cost Optimization Available',
              code: 112101,
            },
          },
          recommendation_engines: {
            cost: {
              config: {
                limits: {
                  cpu: { amount: 0.6, format: 'cores' },
                  memory: { amount: 1.5, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: 0.3, format: 'cores' },
                  memory: { amount: 0.75, format: 'GiB' },
                },
              },
              variation: {
                limits: {
                  cpu: { amount: -0.4, format: 'cores' },
                  memory: { amount: -0.5, format: 'GiB' },
                },
                requests: {
                  cpu: { amount: -0.2, format: 'cores' },
                  memory: { amount: -0.25, format: 'GiB' },
                },
              },
            },
          },
        },
      },
    },
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
