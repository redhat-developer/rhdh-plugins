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

import {
  PropertyKeys,
  type InferenceService,
  type ModelCatalog,
  type Model,
  type ModelServer,
  Type as APIType,
  sanitizeName,
} from './types';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { CATALOG_SOURCE_ANNOTATION, CATALOG_MODEL_ANNOTATION } from './Catalog';

const ANNOTATION_PREFIX = 'rhdh.io/';

export const SYSTEM_ANNOTATION = `${ANNOTATION_PREFIX}system`;
export const SERVER_TYPE_ANNOTATION = `${ANNOTATION_PREFIX}serverType`;
export const MODEL_PREFIX_ANNOTATION = `${ANNOTATION_PREFIX}model-`;
export const DEFAULT_ANNOTATION = `${ANNOTATION_PREFIX}default`;
export const OWNER_ANNOTATION = `${ANNOTATION_PREFIX}owner`;
export const LIFECYCLE_ANNOTATION = `${ANNOTATION_PREFIX}lifecycle`;

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

function fixKeyForAnnotation(key: string): string {
  return key.toLowerCase().replace(/ /g, '');
}

function getStringPropVal(
  key: string,
  is: InferenceService,
): string | undefined {
  if (!is?.metadata.annotations) {
    return undefined;
  }

  const annotationKey = `${ANNOTATION_PREFIX}${fixKeyForAnnotation(key)}`;
  return is.metadata.annotations[annotationKey] || undefined;
}

function getName(is: InferenceService): string {
  return `${is.metadata.namespace}_${is.metadata.name}`;
}

function getDescription(is: InferenceService): string {
  return `KServe instance ${is.metadata.namespace}:${is.metadata.name}`;
}

const PREDICTOR_FRAMEWORK_KEYS: ReadonlyArray<[string, string]> = [
  ['sklearn', FRAMEWORK_SKLEARN],
  ['xgboost', FRAMEWORK_XGBOOST],
  ['tensorflow', FRAMEWORK_TENSORFLOW],
  ['pytorch', FRAMEWORK_PYTORCH],
  ['triton', FRAMEWORK_TRITON],
  ['onnx', FRAMEWORK_ONNX],
  ['huggingface', FRAMEWORK_HUGGINGFACE],
  ['pmml', FRAMEWORK_PMML],
  ['lightgbm', FRAMEWORK_LIGHTGBM],
  ['paddle', FRAMEWORK_PADDLE],
];

function getPredictorTags(predictor: any, is: InferenceService): string[] {
  const tags: string[] = PREDICTOR_FRAMEWORK_KEYS.filter(
    ([key]) => predictor[key],
  ).map(([, tag]) => tag);

  if (predictor.model?.modelFormat) {
    const { name, version } = predictor.model.modelFormat;
    tags.push(version ? `${name}-${version}`.toLowerCase() : name.toLowerCase());
  }

  if (is.spec.explainer?.art) {
    tags.push(is.spec.explainer.art.type.toLowerCase());
  }

  return tags;
}

function getTags(is: InferenceService): string[] {
  if (!is) {
    return [];
  }

  // InferenceService (v1beta1) uses spec.predictor; LLMInferenceService (v1alpha2)
  // uses spec.model directly with no predictor field.
  if (is.spec.predictor) {
    return getPredictorTags(is.spec.predictor, is);
  }

  // LLMInferenceService: use the model name as a tag
  if (is.spec.model?.name) {
    return [sanitizeName(is.spec.model.name)];
  }

  return [];
}

function getTagsFromLabels(is: InferenceService): string[] {
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

function getArtifactLocationURL(is: InferenceService): string | undefined {
  // InferenceService (v1beta1): storage is under spec.predictor.model
  const predictorModel = is.spec.predictor?.model;
  if (predictorModel?.storageURI) {
    return predictorModel.storageURI;
  }
  if (predictorModel?.storage?.path) {
    return `s3://${predictorModel.storage.path}`;
  }

  // LLMInferenceService (v1alpha2): storage URI is at spec.model.uri
  if (is.spec.model?.uri) {
    return is.spec.model.uri;
  }

  return undefined;
}

export async function callBackstagePrinters(
  owner: string,
  lifecycle: string,
  is: InferenceService,
  authentication: boolean = false,
  logger?: LoggerService,
): Promise<ModelCatalog> {
  logger?.debug(
    `KServe.callBackstagePrinters: namespace=${is.metadata.namespace}, name=${is.metadata.name}, authentication=${authentication}`,
  );

  return generateModelCatalog(owner, lifecycle, is, authentication);
}

function generateModelCatalog(
  owner: string,
  lifecycle: string,
  is: InferenceService,
  authentication: boolean,
): ModelCatalog {
  const name = sanitizeName(getName(is));

  const ownerValue =
    getStringPropVal(PropertyKeys.Owner, is) || sanitizeName(owner);
  const lifecycleValue =
    getStringPropVal(PropertyKeys.Lifecycle, is) || lifecycle;
  const description =
    getStringPropVal(PropertyKeys.DescriptionKey, is) || getDescription(is);
  let techdocsUrl = getStringPropVal(PropertyKeys.TechDocsKey, is);

  // Auto-set TechDocsKey when catalog annotations are present and
  // techdocsUrl is not already set via an explicit annotation.
  if (techdocsUrl === undefined && is.metadata.annotations) {
    const sourceId = is.metadata.annotations[CATALOG_SOURCE_ANNOTATION];
    const modelName = is.metadata.annotations[CATALOG_MODEL_ANNOTATION];
    if (sourceId && modelName) {
      // Path only — ModelCatalogGenerator.ts prepends svcUrl and wraps
      // in the url: prefix.
      techdocsUrl = `/modelcard/${sourceId}/${modelName}`;
    }
  }

  // Build models from rhdh.io/model-* annotations when present,
  // otherwise fall back to a single model named after the InferenceService.
  const modelPrefixModels: Model[] = [];
  if (is.metadata.annotations) {
    for (const [k, v] of Object.entries(is.metadata.annotations)) {
      if (k.startsWith(MODEL_PREFIX_ANNOTATION)) {
        modelPrefixModels.push({
          name: sanitizeName(v),
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
        });
      }
    }
  }

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

  // Sort annotation-derived models by name for deterministic ordering,
  // since Object.entries() order is not guaranteed across K8s API responses.
  modelPrefixModels.sort((a, b) => a.name.localeCompare(b.name));

  const models = modelPrefixModels.length > 0 ? modelPrefixModels : [model];

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

  // Propagate system, serverType, default, owner, and lifecycle annotations
  // to the ModelServer so ModelCatalogGenerator can map them to entity fields.
  const serverAnnotations: Record<string, string> = {};
  if (is.metadata.annotations) {
    const systemVal = is.metadata.annotations[SYSTEM_ANNOTATION];
    if (systemVal) serverAnnotations[SYSTEM_ANNOTATION] = systemVal;

    const serverTypeVal = is.metadata.annotations[SERVER_TYPE_ANNOTATION];
    if (serverTypeVal)
      serverAnnotations[SERVER_TYPE_ANNOTATION] = serverTypeVal;

    const defaultVal = is.metadata.annotations[DEFAULT_ANNOTATION];
    if (defaultVal)
      serverAnnotations[DEFAULT_ANNOTATION] = sanitizeName(defaultVal);

    const ownerVal = is.metadata.annotations[OWNER_ANNOTATION];
    if (ownerVal) serverAnnotations[OWNER_ANNOTATION] = sanitizeName(ownerVal);

    const lifecycleVal = is.metadata.annotations[LIFECYCLE_ANNOTATION];
    if (lifecycleVal) serverAnnotations[LIFECYCLE_ANNOTATION] = lifecycleVal;
  }

  const modelServer: ModelServer = {
    name: sanitizeName(name),
    owner: sanitizeName(ownerValue),
    lifecycle: lifecycleValue,
    description: description,
    homepageURL: getStringPropVal(PropertyKeys.HomepageURLKey, is),
    usage: getStringPropVal(PropertyKeys.UsageKey, is),
    tags: getTagsFromLabels(is),
    authentication: authentication,
    ...(Object.keys(serverAnnotations).length > 0 && {
      annotations: serverAnnotations,
    }),
    API: {
      type: apiType,
      spec: getStringPropVal(PropertyKeys.APISpecKey, is) || 'TBD',
      tags: getTagsFromLabels(is),
      url: is.status?.url?.toString() || is.status?.address?.url || '',
    },
  };

  return {
    models,
    modelServer: modelServer,
  };
}
