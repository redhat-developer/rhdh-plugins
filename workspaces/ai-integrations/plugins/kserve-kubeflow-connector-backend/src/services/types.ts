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

// Shared types and constants to avoid circular dependencies between InformerService.ts and Kfmr.ts

import * as k8s from '@kubernetes/client-node';

// Route constants
export const route_group = 'route.openshift.io';
export const route_version = 'v1';
export const route_plural = 'routes';

// Route interfaces
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

// InferenceService interface (used across modules)
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

// KFMR Client interface
export interface KFMRClient {
  rootRegistryURL: string;
  rootCatalogURL?: string;
  token: string;
  listRegisteredModels(): Promise<RegisteredModel[]>;
  listInferenceServices(): Promise<KFMRInferenceService[]>;
  listModelVersions(registeredModelId: string): Promise<ModelVersion[]>;
  listModelArtifacts(modelVersionId: string): Promise<ModelArtifact[]>;
  getServingEnvironment(
    servingEnvironmentId: string,
  ): Promise<ServingEnvironment>;
  getModelVersion(modelVersionId: string): Promise<ModelVersion>;
  getModelCard(
    sourceId: string,
    modelName: string,
  ): Promise<string | undefined>;
}

// Metadata value interface (from openapi package)
export interface MetadataValue {
  metadataStringValue?: {
    stringValue: string;
  };
  metadataIntValue?: {
    intValue: number;
  };
  metadataBoolValue?: {
    boolValue: boolean;
  };
  metadataDoubleValue?: {
    doubleValue: number;
  };
}

// Model state enums
export enum RegisteredModelState {
  Live = 'LIVE',
  Archived = 'ARCHIVED',
}

export enum ModelVersionState {
  Live = 'LIVE',
  Archived = 'ARCHIVED',
}

export enum InferenceServiceState {
  Deployed = 'DEPLOYED',
  Undeployed = 'UNDEPLOYED',
}

// KFMR model interfaces
export interface RegisteredModel {
  id?: string;
  name: string;
  lastUpdateTimeSinceEpoch?: string;
  description?: string;
  owner?: string;
  state?: RegisteredModelState;
  customProperties?: { [key: string]: MetadataValue };
}

export interface RegisteredModelList {
  items: RegisteredModel[];
}

export interface ModelVersion {
  id?: string;
  name: string;
  lastUpdateTimeSinceEpoch?: string;
  registeredModelId?: string;
  description?: string;
  state?: ModelVersionState;
  customProperties?: { [key: string]: MetadataValue };
}

export interface ModelVersionList {
  items: ModelVersion[];
}

export interface ModelArtifact {
  id?: string;
  name?: string;
  modelVersionId?: string;
  modelSourceClass?: string;
  modelSourceGroup?: string;
  modelSourceName?: string;
  uri?: string;
  description?: string;
  customProperties?: { [key: string]: MetadataValue };
}

export interface ModelArtifactList {
  items: ModelArtifact[];
}

export interface KFMRInferenceService {
  id?: string;
  name?: string;
  registeredModelId?: string;
  modelVersionId?: string;
  servingEnvironmentId?: string;
  desiredState?: InferenceServiceState;
  runtime?: string;
  customProperties?: { [key: string]: MetadataValue };
}

export interface InferenceServiceList {
  items: KFMRInferenceService[];
}

export interface ServingEnvironment {
  id?: string;
  name?: string;
  description?: string;
  customProperties?: { [key: string]: MetadataValue };
}

// CatalogModel interface (from catalog openapi package)
export interface CatalogModel {
  id?: string;
  name?: string;
  description?: string;
  readme?: string;
  sourceId?: string;
  repositoryName?: string;
}

export interface KServeInferenceService {
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
  };
  spec: any;
  status?: {
    conditions?: Array<{
      type: string;
      status: string;
    }>;
    url?: string;
    address?: {
      url: string;
    };
  };
}

// ReconcilerConfig interface
export interface ReconcilerConfig {
  kfmrClients: Map<string, KFMRClient>;
  kfmrRoutes: Map<string, Route>;
  kfmrCatalogRoute?: Route;
  defaultLifecycle: string;
  defaultOwner: string;
  k8sToken?: string;
  routeClient?: k8s.CustomObjectsApi;
  coreClient?: k8s.CoreV1Api;
  informer?: k8s.Informer<InferenceService> & k8s.ObjectCache<InferenceService>;
}

// Result type for loopOverKFMR
export interface LoopOverKFMRResult {
  registeredModels: RegisteredModel[];
  modelVersionsMap: Map<string, ModelVersion[]>;
  modelArtifactsMap: Map<string, Map<string, ModelArtifact[]>>;
}

// b GGM TODO so I could not get the @redhat-ai-dev/model-catalog-types node module dependency to reconcile, even though
// it does for that entity provider, so duplicating for now
/**
 * Schema for defining AI models and model servers, for conversion to Backstage catalog
 * entities
 */
export interface ModelCatalog {
  /**
   * An array of AI models to be imported into the Backstage catalog
   */
  models: Model[];
  /**
   * A deployed model server running one or more models, exposed over an API
   */
  modelServer?: ModelServer;
}

/**
 * A deployed model server running one or more models, exposed over an API
 *
 * Schema for defining AI model servers, for conversion to Backstage catalog entities
 */
export interface ModelServer {
  /**
   * Annotations relating to the model server, in key-value pair format
   */
  annotations?: { [key: string]: string };
  /**
   * The API metadata associated with the model server
   */
  API?: API;
  /**
   * Whether or not the model server requires authentication to access
   */
  authentication?: boolean;
  /**
   * A description of the model server and what it's for
   */
  description: string;
  /**
   * The URL for the model server's homepage, if present
   */
  homepageURL?: string;
  /**
   * The lifecycle state of the model server API
   */
  lifecycle: string;
  /**
   * The name of the model server
   */
  name: string;
  /**
   * The Backstage user that will be responsible for the model server
   */
  owner: string;
  /**
   * Descriptive tags for the model server
   */
  tags?: string[];
  /**
   * How to use and interact with the model server
   */
  usage?: string;
}

/**
 * The API metadata associated with the model server
 *
 * Schema for defining the API exposed by model servers, for conversion to Backstage catalog
 * entities
 */
export interface API {
  /**
   * Annotations relating to the model, in key-value pair format
   */
  annotations?: { [key: string]: string };
  /**
   * A link to the schema used by the model server API
   */
  spec: string;
  /**
   * Descriptive tags for the model server's API
   */
  tags?: string[];
  /**
   * The type of API that the model server exposes
   */
  type: Type;
  /**
   * The URL that the model server's REST API is exposed over, how the model(s) are interacted
   * with
   */
  url: string;
}

/**
 * The type of API that the model server exposes
 */
export enum Type {
  Asyncapi = 'asyncapi',
  Graphql = 'graphql',
  Grpc = 'grpc',
  Openapi = 'openapi',
}

/**
 * An AI model to be imported into the Backstage catalog
 *
 * Schema for defining AI models conversion to Backstage catalog entities
 */
export interface Model {
  /**
   * Annotations relating to the model, in key-value pair format
   */
  annotations?: { [key: string]: string };
  /**
   * A URL to access the model's artifacts, e.g. on HuggingFace, Minio, Github, etc
   */
  artifactLocationURL?: string;
  /**
   * A description of the model and what it's for
   */
  description: string;
  /**
   * Any ethical considerations for the model
   */
  ethics?: string;
  /**
   * The URL pointing to any specific documentation on how to use the model on the model server
   */
  howToUseURL?: string;
  /**
   * The license used by the model (e.g. Apache-2).
   */
  license?: string;
  /**
   * The lifecycle state of the model server API
   */
  lifecycle: string;
  /**
   * The name of the model
   */
  name: string;
  /**
   * The Backstage user that will be responsible for the model
   */
  owner: string;
  /**
   * Support information for the model / where to open issues
   */
  support?: string;
  /**
   * Descriptive tags for the model
   */
  tags?: string[];
  /**
   * Information on how the model was trained
   */
  training?: string;
  /**
   * How to use and interact with the model
   */
  usage?: string;
}

// DiscoveryResponse type matching Go DicoveryResponse (server.go line 158-160)
export interface DiscoveryResponse {
  uris: string[];
}

// e GGM
