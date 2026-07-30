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

// Converted from kserve.go in model-catalog-bridge

import { PropertyKeys } from './Kfmr';
import {
  type ModelCatalog,
  type Model,
  type ModelServer,
  Type as APIType,
} from './types'; // '@redhat-ai-dev/model-catalog-types';

// Annotation prefix (from brdgtypes package)
const ANNOTATION_PREFIX = 'model-catalog-bridge.ai.redhat.com/';

// Model framework constants (from kserve.go line 25-36)
const FRAMEWORK_SKLEARN = 'sklearn';
const FRAMEWORK_XGBOOST = 'xgboost';
const FRAMEWORK_TENSORFLOW = 'tensorflow';
const FRAMEWORK_PYTORCH = 'pytorch';
const FRAMEWORK_TRITON = 'triton';
const FRAMEWORK_ONNX = 'onnx';
const FRAMEWORK_HUGGINGFACE = 'huggingface';
const FRAMEWORK_PMML = 'pmml';
const FRAMEWORK_LIGHTGBM = 'lightgbm';
const FRAMEWORK_PADDLE = 'paddle';

// InferenceService interface (matching KServe API)
export interface KServeInferenceService {
  metadata: {
    name: string;
    namespace: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
  };
  spec: {
    predictor: {
      sklearn?: any;
      xgboost?: any;
      tensorflow?: any;
      pytorch?: any;
      triton?: any;
      onnx?: any;
      huggingface?: any;
      pmml?: any;
      lightgbm?: any;
      paddle?: any;
      model?: {
        modelFormat: {
          name: string;
          version?: string;
        };
        storageURI?: string;
        storage?: {
          path?: string;
        };
      };
    };
    explainer?: {
      art?: {
        type: string;
      };
    };
  };
  status?: {
    url?: {
      toString(): string;
    };
    address?: {
      url: string;
    };
    components?: {
      [key: string]: {
        url?: {
          toString(): string;
        };
        restURL?: {
          toString(): string;
        };
        grpcURL?: {
          toString(): string;
        };
      };
    };
  };
}

// Re-export types from @redhat-ai-dev/model-catalog-types for use by consumers
export type { ModelCatalog, Model, ModelServer };

// Helper function: Sanitize name
function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// Helper function: Fix key for annotation (kserve.go line 315)
function fixKeyForAnnotation(key: string): string {
  const lowerKey = key.toLowerCase();
  return lowerKey.replace(/ /g, '');
}

// Helper function: Get string property value from annotations (kserve.go line 322)
function getStringPropVal(
  key: string,
  is: KServeInferenceService,
): string | undefined {
  if (!is || !is.metadata.annotations) {
    return undefined;
  }

  const annotationKey = `${ANNOTATION_PREFIX}${fixKeyForAnnotation(key)}`;
  const val = is.metadata.annotations[annotationKey];

  return val || undefined;
}

// Get name (namespace_name format) - kserve.go line 54
function getName(is: KServeInferenceService): string {
  return `${is.metadata.namespace}_${is.metadata.name}`;
}

// Get description - kserve.go line 60
function getDescription(is: KServeInferenceService): string {
  return `KServe instance ${is.metadata.namespace}:${is.metadata.name}`;
}

// Get tags from predictor spec - kserve.go line 113
function getTags(is: KServeInferenceService): string[] {
  const tags: string[] = [];

  if (!is) {
    return tags;
  }

  const predictor = is.spec.predictor;

  // Check predictor types (Go uses fallthrough, so we check all)
  if (predictor.sklearn) tags.push(FRAMEWORK_SKLEARN);
  if (predictor.xgboost) tags.push(FRAMEWORK_XGBOOST);
  if (predictor.tensorflow) tags.push(FRAMEWORK_TENSORFLOW);
  if (predictor.pytorch) tags.push(FRAMEWORK_PYTORCH);
  if (predictor.triton) tags.push(FRAMEWORK_TRITON);
  if (predictor.onnx) tags.push(FRAMEWORK_ONNX);
  if (predictor.huggingface) tags.push(FRAMEWORK_HUGGINGFACE);
  if (predictor.pmml) tags.push(FRAMEWORK_PMML);
  if (predictor.lightgbm) tags.push(FRAMEWORK_LIGHTGBM);
  if (predictor.paddle) tags.push(FRAMEWORK_PADDLE);

  // Generic model format
  if (predictor.model) {
    const modelFormat = predictor.model.modelFormat;
    let tag = modelFormat.name;
    if (modelFormat.version) {
      tag = `${tag}-${modelFormat.version}`;
    }
    tags.push(tag.toLowerCase());
  }

  // Explainer
  if (is.spec.explainer?.art) {
    tags.push(is.spec.explainer.art.type.toLowerCase());
  }

  return tags;
}

// Get tags from labels - used for ModelServer and API - kserve.go line 391
function getTagsFromLabels(is: KServeInferenceService): string[] {
  const tags: string[] = [];

  if (!is.metadata.labels) {
    return tags;
  }

  for (const [k, v] of Object.entries(is.metadata.labels)) {
    const tag = `${sanitizeName(k)}-${sanitizeName(v)}`;
    tags.push(sanitizeName(tag));
  }

  return tags;
}

// Get artifact location URL - kserve.go line 580
function getArtifactLocationURL(
  is: KServeInferenceService,
): string | undefined {
  const model = is.spec.predictor.model;

  if (model?.storageURI) {
    return model.storageURI;
  }

  if (model?.storage?.path) {
    return `s3://${model.storage.path}`;
  }

  return undefined;
}

// Main function: Call backstage printers for KServe
// Converted from CallBackstagePrinters (kserve.go line 260)
export async function callBackstagePrinters(
  owner: string,
  lifecycle: string,
  is: KServeInferenceService,
  authentication: boolean = false,
): Promise<ModelCatalog> {
  console.log(
    `KServe.callBackstagePrinters: namespace=${is.metadata.namespace}, name=${is.metadata.name}, authentication=${authentication}`,
  );

  return generateModelCatalog(owner, lifecycle, is, authentication);
}

// Generate model catalog (kserve.go line 269-276)
function generateModelCatalog(
  owner: string,
  lifecycle: string,
  is: KServeInferenceService,
  authentication: boolean,
): ModelCatalog {
  const name = `${sanitizeName(getName(is))}`;

  // Get property values with fallbacks
  const ownerValue =
    getStringPropVal(PropertyKeys.Owner, is) || sanitizeName(owner);
  const lifecycleValue =
    getStringPropVal(PropertyKeys.Lifecycle, is) || lifecycle;
  const description =
    getStringPropVal(PropertyKeys.DescriptionKey, is) || getDescription(is);
  const techdocsUrl = getStringPropVal(PropertyKeys.TechDocsKey, is);

  // Build model object (kserve.go line 646-674)
  const model: Model = {
    name: name,
    owner: sanitizeName(ownerValue),
    lifecycle: lifecycleValue,
    description: description,
    tags: getTags(is),
    artifactLocationURL: getArtifactLocationURL(is),
    ethics: getStringPropVal(PropertyKeys.EthicsKey, is),
    howToUseURL: getStringPropVal(PropertyKeys.HowToUseKey, is),
    support: getStringPropVal(PropertyKeys.SupportKey, is),
    training: getStringPropVal(PropertyKeys.TrainingKey, is),
    usage: getStringPropVal(PropertyKeys.UsageKey, is),
    license: getStringPropVal(PropertyKeys.LicenseKey, is),
    annotations: {
      'model-name': is.metadata.name,
      ...(techdocsUrl ? { [PropertyKeys.TechDocsKey]: techdocsUrl } : {}),
    },
  };

  // Determine API type
  const apiTypeStr = getStringPropVal(PropertyKeys.APITypeKey, is);
  let apiType = APIType.Openapi;
  if (apiTypeStr) {
    switch (apiTypeStr.toLowerCase()) {
      case 'graphql':
        apiType = APIType.Graphql;
        break;
      case 'asyncapi':
        apiType = APIType.Asyncapi;
        break;
      case 'grpc':
        apiType = APIType.Grpc;
        break;
      default:
        apiType = APIType.Openapi;
    }
  }

  // Build model server object (kserve.go line 679-698)
  const modelServer: ModelServer = {
    name: sanitizeName(name),
    owner: sanitizeName(ownerValue),
    lifecycle: lifecycleValue,
    description: description,
    homepageURL: getStringPropVal(PropertyKeys.HomepageURLKey, is),
    usage: getStringPropVal(PropertyKeys.UsageKey, is),
    tags: getTagsFromLabels(is),
    authentication: authentication,
    API: {
      type: apiType,
      spec: getStringPropVal(PropertyKeys.APISpecKey, is) || 'TBD',
      tags: getTagsFromLabels(is),
      url: is.status?.url?.toString() || is.status?.address?.url || '',
    },
  };

  return {
    models: [model],
    modelServer: modelServer,
  };
}

// Export helper functions that may be needed
export { getName, getDescription, getTags };
