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

// Common GroupVersionKind type
export type GroupVersionKind = {
  kind: string;
  apiVersion: string;
  apiGroup: string;
  plural: string;
};

// Generic resource data structure
export type ResourceData<T = any> = {
  data: T[];
};

// Cluster and error types
export type ClusterError = {
  cluster: string;
  namespace: string;
  errorType?: string;
  message?: string;
  resourcePath?: string;
  statusCode?: number;
  reason?: string;
  source?: 'kubernetes' | 'kubearchive';
};

export type ClusterErrors = ClusterError[];

export type ClusterInfo = {
  name: string;
  konfluxUI?: string;
  openshiftConsoleUrl?: string;
};

export type SubcomponentInfo = {
  name: string;
};

export type K8sResourceIdentifier = {
  apiGroup?: string;
  apiVersion: string;
  kind: string;
};

export type OwnerReference = {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
};

export type K8sResourceCommon = K8sResourceIdentifier &
  Partial<{
    metadata: Partial<{
      annotations: Record<string, string>;
      clusterName: string;
      creationTimestamp: string;
      deletionGracePeriodSeconds: number;
      deletionTimestamp: string;
      finalizers: string[];
      generateName: string;
      generation: number;
      labels: Record<string, string>;
      managedFields: unknown[];
      name: string;
      namespace: string;
      ownerReferences: OwnerReference[];
      resourceVersion: string;
      uid: string;
    }>;
    spec: {
      [key: string]: unknown;
    };
    status: { [key: string]: unknown };
    data: { [key: string]: unknown };
  }>;

export type K8sResourceCommonWithClusterInfo = K8sResourceCommon & {
  cluster: ClusterInfo;
  subcomponent: SubcomponentInfo;
};

export type PipelineRunResource = K8sResourceCommonWithClusterInfo & {
  kind: 'PipelineRun';
  [key: string]: any;
};

export type ApplicationResource = K8sResourceCommonWithClusterInfo & {
  kind: 'Application';
  [key: string]: any;
};

export type ComponentResource = K8sResourceCommonWithClusterInfo & {
  kind: 'Component';
  [key: string]: any;
};

export enum runStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  'In Progress' = 'In Progress',
  FailedToStart = 'FailedToStart',
  PipelineNotStarted = 'Starting',
  NeedsMerge = 'PR needs merge',
  Skipped = 'Skipped',
  Cancelled = 'Cancelled',
  Cancelling = 'Cancelling',
  Pending = 'Pending',
  Idle = 'Idle',
  TestWarning = 'Test Warnings',
  TestFailed = 'Test Failures',
  Unknown = 'Unknown',
}

export enum ReleaseCondition {
  Processed = 'Processed',
  Validated = 'Validated',
  Released = 'Released',
}

export type ReleaseResource = K8sResourceCommonWithClusterInfo & {
  kind: 'Release';
  status?: {
    conditions?: {
      type?: ReleaseCondition;
      reason?: string;
      status?: string;
      message?: string;
    }[];
    [key: string]: any;
  };
  [key: string]: any;
};

// Response data types

// Types for subcomponent-based configuration
export type SubcomponentClusterConfig = {
  subcomponent: string;
  cluster: string;
  namespace: string;
  applications: string[];
};

export interface KonfluxClusterConfig {
  apiUrl?: string;
  uiUrl?: string;
  serviceAccountToken?: string;
  kubearchiveApiUrl?: string;
}

export interface KonfluxComponentClusterConfig {
  cluster?: string;
  namespace?: string;
  applications?: string[];
}

export interface KonfluxComponentConfig {
  clusters?: KonfluxComponentClusterConfig[];
}
export interface KonfluxConfig {
  authProvider: 'serviceAccount' | 'oidc' | 'impersonationHeaders';
  clusters: Record<string, KonfluxClusterConfig>;
  subcomponentConfigs: SubcomponentClusterConfig[];
}

export interface Filters {
  subcomponent?: string;
  clusters?: string[];
  application?: string;
  component?: string;
  continuationToken?: string;
}
