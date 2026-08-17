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

function getTags(is: InferenceService): string[] {
  const tags: string[] = [];

  if (!is) {
    return tags;
  }

  const predictor = is.spec.predictor;

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

  if (predictor.model) {
    const modelFormat = predictor.model.modelFormat;
    let tag = modelFormat.name;
    if (modelFormat.version) {
      tag = `${tag}-${modelFormat.version}`;
    }
    tags.push(tag.toLowerCase());
  }

  if (is.spec.explainer?.art) {
    tags.push(is.spec.explainer.art.type.toLowerCase());
  }

  return tags;
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
  const model = is.spec.predictor.model;

  if (model?.storageURI) {
    return model.storageURI;
  }

  if (model?.storage?.path) {
    return `s3://${model.storage.path}`;
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
