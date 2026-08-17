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

// Shared types, constants, and utilities for the kserve-kubeflow-connector-backend plugin

import * as k8s from '@kubernetes/client-node';
import type { LoggerService } from '@backstage/backend-plugin-api';

// Route constants
export const route_group = 'route.openshift.io';
export const route_version = 'v1';
export const route_plural = 'routes';

export interface RouteIngress {
  host: string;
}

export interface RouteStatus {
  ingress?: RouteIngress[];
}

export interface Route {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
  };
  spec: any;
  status?: RouteStatus;
}

export interface InferenceService {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
  };
  spec: any;
  status?: InferenceServiceStatus;
}

export interface Condition {
  type: string;
  status: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface ModelStatus {
  transitionStatus?: string;
  states?: any;
}

export interface InferenceServiceStatus {
  conditions?: Condition[];
  modelStatus?: ModelStatus;
  url?: string;
  address?: {
    url: string;
  };
}

export interface CatalogModel {
  id?: string;
  name?: string;
  description?: string;
  readme?: string;
  sourceId?: string;
  repositoryName?: string;
}

export interface ReconcilerConfig {
  catalogRoute?: Route;
  catalogUrl?: string;
  defaultLifecycle?: string;
  defaultOwner?: string;
  serviceAccountToken?: string;
  clusterName?: string;
  url?: string;
  skipTLSVerify?: boolean;
  caData?: string;
  routeClient?: k8s.CustomObjectsApi;
  coreClient?: k8s.CoreV1Api;
  informer?: k8s.Informer<InferenceService> & k8s.ObjectCache<InferenceService>;
  logger?: LoggerService;
}

export type {
  ModelCatalog,
  Model,
  ModelServer,
  API,
} from '@redhat-ai-dev/model-catalog-types';

export enum Type {
  Asyncapi = 'asyncapi',
  Graphql = 'graphql',
  Grpc = 'grpc',
  Openapi = 'openapi',
}

export interface DiscoveryResponse {
  uris: string[];
}

export const PropertyKeys = {
  LicenseKey: 'license',
  TechDocsKey: 'techdocs',
  RHOAIModelCatalogSourceModelVersion:
    'rhoai-model-catalog-source-model-version',
  RHOAIModelCatalogSourceModelKey: 'rhoai-model-catalog-source-model',
  RHOAIModelCatalogRegisteredFromKey: 'rhoai-model-catalog-registered-from',
  RHOAIModelCatalogProviderKey: 'rhoai-model-catalog-provider',
  APITypeKey: 'api-type',
  RHOAIModelRegistryRegisteredFromCatalogRepositoryName:
    'rhoai-model-registry-registered-from-catalog-repository-name',
  RHOAIModelRegistryLastModified: 'last-modified',
  Owner: 'owner',
  Lifecycle: 'lifecycle',
  EthicsKey: 'ethics',
  HowToUseKey: 'how-to-use',
  SupportKey: 'support',
  TrainingKey: 'training',
  UsageKey: 'usage',
  HomepageURLKey: 'homepage-url',
  APISpecKey: 'api-spec',
  DescriptionKey: 'description',
};

export function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
