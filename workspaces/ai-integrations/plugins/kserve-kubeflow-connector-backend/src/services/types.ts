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

// CatalogModel interface (from catalog openapi package)
export interface CatalogModel {
  id?: string;
  name?: string;
  description?: string;
  readme?: string;
  sourceId?: string;
  repositoryName?: string;
}

// ReconcilerConfig interface
export interface ReconcilerConfig {
  catalogRoute?: Route;
  catalogUrl?: string;
  defaultLifecycle: string;
  defaultOwner: string;
  k8sToken?: string;
  routeClient?: k8s.CustomObjectsApi;
  coreClient?: k8s.CoreV1Api;
  informer?: k8s.Informer<InferenceService> & k8s.ObjectCache<InferenceService>;
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

// DiscoveryResponse type matching Go DicoveryResponse (server.go line 158-160)
export interface DiscoveryResponse {
  uris: string[];
}

// Normalizer formats
export enum NormalizerFormat {
  JsonArrayFormat = 'json-array',
  CatalogInfoYamlFormat = 'catalog-info.yaml',
}

// Custom property keys (from brdgtypes package)
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

// Constants
const TAG_REGEXP = '^[a-z0-9:+#]+(\\-[a-z0-9:+#]+)*$';

// Helper function: Extract tags from custom properties
// Converted from getTagsFromCustomProps (kfmr.go line 142)
export function getTagsFromCustomProps(
  lastMod: boolean,
  props: { [key: string]: MetadataValue },
): { [key: string]: string } {
  const tags: { [key: string]: string } = {};
  const regex = new RegExp(TAG_REGEXP);

  for (const [cpk, cpv] of Object.entries(props)) {
    // Skip certain keys (line 146-150)
    if (cpk === PropertyKeys.LicenseKey || cpk === PropertyKeys.TechDocsKey) {
      console.log('Skip adding TechDocs or License key to tags');
      continue;
    }

    // Handle specific property keys (line 151-168)
    if (
      cpk === PropertyKeys.RHOAIModelCatalogSourceModelVersion ||
      cpk === PropertyKeys.RHOAIModelCatalogSourceModelKey ||
      cpk === PropertyKeys.RHOAIModelCatalogRegisteredFromKey ||
      cpk === PropertyKeys.RHOAIModelCatalogProviderKey ||
      cpk === PropertyKeys.APITypeKey ||
      cpk === PropertyKeys.RHOAIModelRegistryRegisteredFromCatalogRepositoryName
    ) {
      let v = '';
      if (cpv.metadataStringValue) {
        v = cpv.metadataStringValue.stringValue.toLowerCase();
      }
      if (v.length > 0 && regex.test(v) && v.length <= 63) {
        tags[cpk] = v;
      }
      continue;
    }

    // Handle last modified timestamp (line 169-185)
    if (cpk === PropertyKeys.RHOAIModelRegistryLastModified && lastMod) {
      let v = '';
      if (cpv.metadataStringValue) {
        v = cpv.metadataStringValue.stringValue;
        v = v.replace(/:/g, '-');
        v = v.replace(/\./g, '-');
        v = v.replace(/T/g, '-');
        v = v.replace(/Z/g, '');
        v = `last-modified-time-${v}`;
      }
      if (v.length > 0 && regex.test(v) && v.length <= 63) {
        v = v.toLowerCase();
        tags[cpk] = v;
      }
      continue;
    }

    // Default handling (line 186-194)
    let v = cpk;
    if (
      cpv.metadataStringValue &&
      cpv.metadataStringValue.stringValue.length > 0
    ) {
      v = `${v}-${cpv.metadataStringValue.stringValue.toLowerCase()}`;
    }
    if (v.length > 0 && regex.test(v) && v.length <= 63) {
      tags[cpk] = v;
    }
  }

  return tags;
}

// Generic interface for objects with optional custom properties
interface HasCustomProperties {
  customProperties?: { [key: string]: MetadataValue };
}

// Helper function: Get string property value from custom properties
// Checks each source in order, returning the first match found
export function getStringPropVal(
  key: string,
  ...sources: HasCustomProperties[]
): string | undefined {
  for (const source of sources) {
    if (source.customProperties) {
      const value = innerGetStringPropVal(key, source.customProperties);
      if (value) {
        return value;
      }
    }
  }
  return undefined;
}

// Helper function: Inner get string property value
function innerGetStringPropVal(
  key: string,
  vmap: { [key: string]: MetadataValue },
): string | undefined {
  const v = vmap[key];
  if (!v) {
    return undefined;
  }

  if (v.metadataStringValue) {
    return v.metadataStringValue.stringValue;
  }

  return undefined;
}

// Sanitize name helper
export function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// Sanitize model version helper
export function sanitizeModelVersion(version: string): string {
  return version.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
