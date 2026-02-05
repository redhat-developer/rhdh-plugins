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

// Converted from kfmr.go in model-catalog-bridge

import {
  ModelCatalog,
  Model,
  ModelServer,
  API,
  Type as APIType,
} from './types'; // '@redhat-ai-dev/model-catalog-types';

import {
  type ReconcilerConfig,
  type Route,
  type RegisteredModel,
  type RegisteredModelList,
  type ModelVersion,
  type ModelVersionList,
  type ModelArtifact,
  type ModelArtifactList,
  type KFMRInferenceService,
  type InferenceServiceList,
  type ServingEnvironment,
  type CatalogModel,
  type KServeInferenceService,
  type MetadataValue,
  type KFMRClient,
  type LoopOverKFMRResult,
  RegisteredModelState,
  ModelVersionState,
  route_group,
  route_version,
  route_plural,
} from './types';

// Constants (from kfmr.go line 26-30)
const TAG_REGEXP = '^[a-z0-9:+#]+(\\-[a-z0-9:+#]+)*$';

// Environment variable constants
const MODEL_REGISTRY_ROUTE_ENV_VAR = 'MODEL_REGISTRY_ROUTE';
const MODEL_REGISTRY_TOKEN_ENV_VAR = 'MODEL_REGISTRY_TOKEN';
const KFMR_BASE_URI = '/api/model_registry/v1alpha3';
const KFMR_CATALOG_BASE_URI = '/api/model_catalog/v1';

// REST API URI constants (from pkg/rest/kfmr.go)
const LIST_REG_MODEL_URI = '/registered_models';
// @ts-ignore
const GET_REG_MODEL_URI = '/registered_models/%s';
// @ts-ignore
const LIST_VERSIONS_OFF_REG_MODELS_URI = '/registered_models/%s/versions';
// @ts-ignore
const LIST_ARTIFACTS_OFF_VERSIONS_URI = '/model_versions/%s/artifacts';
// @ts-ignore
const LIST_INFERENCE_SERVICES_URI = '/inference_services';
// @ts-ignore
const GET_SERVING_ENV_URI = '/serving_environments/%s';
// @ts-ignore
const GET_MODEL_ARTIFACT_URI = '/model_artifacts/%s';
// @ts-ignore
const GET_MODEL_VERSION_URI = '/model_versions/%s';
// Catalog API URI (from pkg/rest/kfmr.go line 25)
const GET_CATALOG_MODEL_URI = '/sources/%s/models/%s/%s';

// Helper function for making GET requests to the model registry
// Converted from Go getFromModelRegistry method (rest.go line 57-71)
async function getFromModelRegistry(url: string, token: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GET request to ${url} failed with status ${response.status}: ${body}`,
    );
  }

  console.log(`GET request to ${url} returned ok`);
  return response.json();
}

// Setup KFMR configuration
// Converted from Go setupKFMR method (controller.go line 113-206)
export async function setupKFMR(
  config: ReconcilerConfig,
): Promise<ReconcilerConfig> {
  // Check if KFMR clients already initialized (Go line 114-116)
  if (config.kfmrClients.size > 0) {
    console.log('setupKFMR: KFMR clients already initialized');
    return config;
  }

  // String replacer to remove \r and \n (Go line 118-120)
  const replacer = (str: string) => str.replace(/\r/g, '').replace(/\n/g, '');

  let mrRoute = process.env[MODEL_REGISTRY_ROUTE_ENV_VAR] || '';
  mrRoute = replacer(mrRoute);
  const routeTuples = mrRoute.split(',');

  console.log(`setupKFMR: route env var ${mrRoute}`);

  // Process each route tuple from environment variable (Go line 123-157)
  for (const routeTuple of routeTuples) {
    if (routeTuple.length === 0) {
      continue;
    }

    const parts = routeTuple.split(':');
    let kfmrRoute: Route | undefined;
    let ns = '';
    let name = parts[0];

    if (parts.length > 1) {
      ns = parts[0];
      name = parts[1];
    }

    try {
      // Handle namespace-based route lookup (Go line 135-149)
      if (ns === '' && config.routeClient) {
        // List all routes and find by name
        const listResponse =
          await config.routeClient.listNamespacedCustomObject(
            route_group,
            route_version,
            ns,
            route_plural,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
          );
        const routes = (listResponse.body as any).items as Route[];
        for (const route of routes) {
          if (route.metadata.name === name) {
            kfmrRoute = route;
            break;
          }
        }
      } else if (config.routeClient) {
        // Get specific route by namespace and name (Go line 148)
        const getResponse = await config.routeClient.getNamespacedCustomObject(
          route_group,
          route_version,
          ns,
          route_plural,
          name,
          undefined,
        );
        kfmrRoute = getResponse.body as Route;
      }

      // Store route if it has ingress (Go line 154-156)
      if (
        kfmrRoute &&
        kfmrRoute.status?.ingress &&
        kfmrRoute.status.ingress.length > 0
      ) {
        config.kfmrRoutes.set(routeTuple, kfmrRoute);
      }
    } catch (error) {
      console.error(
        `setupKFMR: error fetching model registry route ${routeTuple}:`,
        error,
      );
      continue;
    }
  }

  console.log(`setupKFMR: env var route list len ${config.kfmrRoutes.size}`);

  // If no routes found via env var, try label-based query (Go line 160-180)
  if (config.kfmrRoutes.size === 0 && config.routeClient) {
    try {
      const listResponse = await config.routeClient.listNamespacedCustomObject(
        route_group,
        route_version,
        '',
        route_plural,
        undefined,
        undefined,
        undefined,
        undefined,
        'app.kubernetes.io/managed-by=model-registry-operator',
        undefined,
        undefined,
        undefined,
        undefined,
        false,
      );
      const routes = (listResponse.body as any).items as Route[];

      for (const route of routes) {
        const key = `${route.metadata.namespace}:${route.metadata.name}`;
        console.log(`setupKFMR: query found route ${key}`);

        if (route.metadata.name.includes('catalog')) {
          // Catalog is supposed to be a singleton (Go line 171-175)
          console.log(`setupKFMR: found catalog ${route.metadata.name}`);
          config.kfmrCatalogRoute = route;
          continue;
        }

        console.log(
          `setupKFMR: found registry ${route.metadata.name} storing into map with key ${key}`,
        );
        config.kfmrRoutes.set(key, route);
      }
    } catch (error) {
      console.error('setupKFMR: error listing routes by label:', error);
    }
  }

  // Get KFMR token (Go line 182-186)
  let kfmrToken = process.env[MODEL_REGISTRY_TOKEN_ENV_VAR] || '';
  kfmrToken = replacer(kfmrToken);
  if (kfmrToken.length === 0) {
    kfmrToken = config.k8sToken || '';
  }

  // Create KFMR client for each route (Go line 187-204)
  for (const [key, kfmrRoute] of config.kfmrRoutes.entries()) {
    // Check if client already exists (Go line 188-192)
    if (config.kfmrClients.has(key)) {
      console.log(
        `setupKFMR: loop through routes check against kfmr key ${key} - already exists`,
      );
      continue;
    }

    if (!kfmrRoute.status?.ingress || kfmrRoute.status.ingress.length === 0) {
      console.log(`setupKFMR: route ${key} has no ingress, skipping`);
      continue;
    }

    // Create KFMRClient wrapper (Go line 193-200)
    const rootRegistryURL = `https://${kfmrRoute.status.ingress[0].host}${KFMR_BASE_URI}`;
    let rootCatalogURL: string | undefined;

    if (
      config.kfmrCatalogRoute?.status?.ingress &&
      config.kfmrCatalogRoute.status.ingress.length > 0
    ) {
      rootCatalogURL = `https://${config.kfmrCatalogRoute.status.ingress[0].host}${KFMR_CATALOG_BASE_URI}`;
    }

    // Create the KFMRClient instance
    const kfmrClient: KFMRClient = {
      rootRegistryURL,
      rootCatalogURL,
      token: kfmrToken,
      // Converted from ListRegisteredModels (registeredmodel.go line 10-22)
      listRegisteredModels: async (): Promise<RegisteredModel[]> => {
        const url = rootRegistryURL + LIST_REG_MODEL_URI;
        const data: RegisteredModelList = await getFromModelRegistry(
          url,
          kfmrToken,
        );
        return data.items || [];
      },
      // Converted from ListInferenceServices (inferenceservice.go line 10-25)
      listInferenceServices: async (): Promise<KFMRInferenceService[]> => {
        const url = rootRegistryURL + LIST_INFERENCE_SERVICES_URI;
        const data: InferenceServiceList = await getFromModelRegistry(
          url,
          kfmrToken,
        );
        return data.items || [];
      },
      // Converted from ListModelVersions (modelversion.go line 10-22)
      listModelVersions: async (
        registeredModelId: string,
      ): Promise<ModelVersion[]> => {
        const url =
          rootRegistryURL +
          LIST_VERSIONS_OFF_REG_MODELS_URI.replace('%s', registeredModelId);
        const data: ModelVersionList = await getFromModelRegistry(
          url,
          kfmrToken,
        );
        return data.items || [];
      },
      // Converted from ListModelArtifacts (modelartifact.go line 11-23)
      listModelArtifacts: async (
        modelVersionId: string,
      ): Promise<ModelArtifact[]> => {
        const url =
          rootRegistryURL +
          LIST_ARTIFACTS_OFF_VERSIONS_URI.replace('%s', modelVersionId);
        const data: ModelArtifactList = await getFromModelRegistry(
          url,
          kfmrToken,
        );
        return data.items || [];
      },
      // Converted from GetServingEnvironment (servingenvironment.go line 10-22)
      getServingEnvironment: async (
        servingEnvironmentId: string,
      ): Promise<ServingEnvironment> => {
        const url =
          rootRegistryURL +
          GET_SERVING_ENV_URI.replace('%s', servingEnvironmentId);
        const data: ServingEnvironment = await getFromModelRegistry(
          url,
          kfmrToken,
        );
        return data;
      },
      // Converted from GetModelVersions (modelversion.go line 24-36)
      getModelVersion: async (
        modelVersionId: string,
      ): Promise<ModelVersion> => {
        const url =
          rootRegistryURL + GET_MODEL_VERSION_URI.replace('%s', modelVersionId);
        const data: ModelVersion = await getFromModelRegistry(url, kfmrToken);
        return data;
      },
      // Converted from GetModelCard (catalogmodel.go line 44-50)
      getModelCard: async (
        sourceId: string,
        repositoryName: string,
        modelName: string,
      ): Promise<string | undefined> => {
        if (!rootCatalogURL) {
          console.log('getModelCard: no catalog URL configured');
          return undefined;
        }
        // URL-encode spaces (Go line 27-30)
        const encodedSourceId = sourceId.replace(/ /g, '%20');
        const encodedRepoName = repositoryName.replace(/ /g, '%20');
        const encodedModelName = modelName.replace(/ /g, '%20');
        const url =
          rootCatalogURL +
          GET_CATALOG_MODEL_URI.replace('%s', encodedSourceId)
            .replace('%s', encodedRepoName)
            .replace('%s', encodedModelName);
        const data: CatalogModel = await getFromModelRegistry(url, kfmrToken);
        return data.readme;
      },
    };

    console.log(
      `setupKFMR: storing route ${key} into kfmr with URL ${rootRegistryURL}`,
    );
    config.kfmrClients.set(key, kfmrClient);
  }

  console.log(`setupKFMR: initialized ${config.kfmrClients.size} KFMR clients`);
  return config;
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

// Re-export types from types.ts for backwards compatibility
export type {
  RegisteredModel,
  RegisteredModelList,
  ModelVersion,
  ModelVersionList,
  ModelArtifact,
  ModelArtifactList,
  KFMRInferenceService,
  InferenceServiceList,
  ServingEnvironment,
  CatalogModel,
  KServeInferenceService,
  MetadataValue,
  KFMRClient,
  LoopOverKFMRResult,
} from './types';

export {
  RegisteredModelState,
  ModelVersionState,
  InferenceServiceState,
} from './types';

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

// Helper function: Get string property value
// Converted from commonGetStringPropVal (kfmr.go line 199)
export function getStringPropVal(
  key: string,
  mv: ModelVersion,
  rm: RegisteredModel,
): string | undefined {
  // Check model version custom properties first
  if (mv.customProperties) {
    const mvValue = innerGetStringPropVal(key, mv.customProperties);
    if (mvValue) {
      return mvValue;
    }
  }

  // Check registered model custom properties
  if (rm.customProperties) {
    return innerGetStringPropVal(key, rm.customProperties);
  }

  return undefined;
}

// Helper function: Inner get string property value
// Converted from innerGetStringPropVal (kfmr.go line 218)
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

// Re-export types from @redhat-ai-dev/model-catalog-types
export type { ModelCatalog, Model, ModelServer, API };
export { APIType };

// Sanitize name helper
function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// Sanitize model version helper
function sanitizeModelVersion(version: string): string {
  // Similar to sanitizeName but may have different rules
  return version.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// Main function: Call backstage printers
// Converted from CallBackstagePrinters (kfmr.go line 711)
export async function callBackstagePrinters(
  owner: string,
  lifecycle: string,
  rm: RegisteredModel,
  mv: ModelVersion,
  mas: ModelArtifact[],
  kfmrIS: KFMRInferenceService | null,
  kserveIS: KServeInferenceService | null,
  authentication: boolean = false,
): Promise<ModelCatalog> {
  console.log(
    `callBackstagePrinters: rm=${rm.name}, mv=${mv.name}, authentication=${authentication}`,
  );

  return generateModelCatalog(
    owner,
    lifecycle,
    rm,
    mv,
    mas,
    kfmrIS,
    kserveIS,
    authentication,
  );
}

// Generate model catalog
// Converted from PrintModelCatalogPopulator logic (kfmr.go line 726-732)
function generateModelCatalog(
  owner: string,
  lifecycle: string,
  rm: RegisteredModel,
  mv: ModelVersion,
  mas: ModelArtifact[],
  kfmrIS: KFMRInferenceService | null,
  kserveIS: KServeInferenceService | null,
  authentication: boolean,
): ModelCatalog {
  const model: Model = {
    name: `${sanitizeName(rm.name)}-${sanitizeModelVersion(mv.name)}`,
    owner: getOwner(owner, rm),
    lifecycle: getLifecycle(lifecycle, mv, rm),
    description: `${rm.description || ''}\n${mv.description || ''}`,
    tags: buildTags(rm, mv, mas),
    artifactLocationURL: mas.length > 0 ? mas[0].uri : undefined,
    annotations: {
      'model-name': `${sanitizeName(rm.name)}-${sanitizeModelVersion(mv.name)}`,
    },
  };

  const modelServer: ModelServer = {
    name: '',
    owner: getOwner(owner, rm),
    lifecycle: getLifecycle(lifecycle, mv, rm),
    description: `${rm.description || ''}\n${mv.description || ''}`,
    tags: buildTags(rm, mv, mas),
    API: {
      type: APIType.Openapi,
      url: '',
      spec: 'TBD',
    },
    authentication: authentication,
  };

  if (kfmrIS !== null) {
    if (kfmrIS.name !== null) {
      modelServer.name = sanitizeName(kfmrIS.name as string);
    }
  }
  if (kserveIS !== null) {
    if (modelServer.name.length === 0) {
      modelServer.name = sanitizeName(kserveIS.metadata.name);
    }
    if (modelServer.API) {
      modelServer.API.url =
        kserveIS.status?.url || kserveIS.status?.address?.url || '';
    }
  }
  return {
    models: [model],
    modelServer: modelServer.name.length > 0 ? modelServer : undefined,
  };
}

// Helper: Get owner with fallback
function getOwner(defaultOwner: string, rm: RegisteredModel): string {
  if (defaultOwner && defaultOwner.length > 0) {
    return sanitizeName(defaultOwner);
  }
  if (rm.owner) {
    return sanitizeName(rm.owner);
  }
  return sanitizeName(defaultOwner);
}

// Helper: Get lifecycle with fallback
function getLifecycle(
  defaultLifecycle: string,
  mv: ModelVersion,
  rm: RegisteredModel,
): string {
  const lifecycle = getStringPropVal(PropertyKeys.Lifecycle, mv, rm);
  if (lifecycle) {
    return sanitizeName(lifecycle);
  }
  return defaultLifecycle;
}

// Helper: Build tags from registered model, model version, and artifacts
function buildTags(
  rm: RegisteredModel,
  mv: ModelVersion,
  mas: ModelArtifact[],
): string[] {
  const tagsMap: { [key: string]: string } = {};

  // Get tags from registered model
  if (rm.customProperties) {
    const rmTags = getTagsFromCustomProps(false, rm.customProperties);
    Object.assign(tagsMap, rmTags);
  }

  // Get tags from model version
  if (mv.customProperties) {
    const mvTags = getTagsFromCustomProps(true, mv.customProperties);
    Object.assign(tagsMap, mvTags);
  }

  // Get tags from model artifacts
  for (const ma of mas) {
    if (ma.customProperties) {
      const maTags = getTagsFromCustomProps(true, ma.customProperties);
      Object.assign(tagsMap, maTags);
    }
  }

  return Object.values(tagsMap);
}

// Helper function: callKubeflowREST
// Converted from callKubeflowREST (kfmr.go line 110-140)
async function callKubeflowREST(
  registeredModelId: string,
  kfmr: KFMRClient,
): Promise<{
  modelVersions: ModelVersion[];
  modelArtifacts: Map<string, ModelArtifact[]>;
}> {
  const finalMVS: ModelVersion[] = [];
  const ma = new Map<string, ModelArtifact[]>();

  // List model versions (Go line 112)
  const mvs = await kfmr.listModelVersions(registeredModelId);

  for (const mv of mvs) {
    // Skip archived model versions (Go line 119-122)
    if (mv.state === ModelVersionState.Archived) {
      console.log(
        `callKubeflowREST: skipping archived model version ${mv.name}`,
      );
      continue;
    }

    finalMVS.push(mv);

    if (!mv.id) continue;

    // List model artifacts (Go line 125)
    let artifacts = await kfmr.listModelArtifacts(mv.id);

    // If no artifacts found for model version, try with registered model ID (Go line 130-136)
    if (artifacts.length === 0) {
      artifacts = await kfmr.listModelArtifacts(registeredModelId);
    }

    ma.set(mv.id, artifacts);
  }

  return { modelVersions: finalMVS, modelArtifacts: ma };
}

// Helper function: loopOverKFMR
// Converted from LoopOverKFMR (kfmr.go line 32-91)
export async function loopOverKFMR(
  kfmr: KFMRClient,
): Promise<LoopOverKFMRResult> {
  const rmArray: RegisteredModel[] = [];
  const mvsMap = new Map<string, ModelVersion[]>();
  const masMap = new Map<string, Map<string, ModelArtifact[]>>();

  // List all registered models (Go line 40)
  const rms = await kfmr.listRegisteredModels();

  for (const rm of rms) {
    // Skip archived registered models (Go line 47-50)
    if (rm.state === RegisteredModelState.Archived) {
      console.log(
        `loopOverKFMR: skipping archived registered model ${rm.name}`,
      );
      continue;
    }

    if (!rm.id) {
      console.log(
        `loopOverKFMR: registered model ${rm.name} has no ID, skipping`,
      );
      continue;
    }

    // Get model versions and artifacts (Go line 53)
    const { modelVersions, modelArtifacts } = await callKubeflowREST(
      rm.id,
      kfmr,
    );

    rmArray.push(rm);
    mvsMap.set(sanitizeName(rm.name), modelVersions);
    masMap.set(sanitizeName(rm.name), modelArtifacts);
  }

  return {
    registeredModels: rmArray,
    modelVersionsMap: mvsMap,
    modelArtifactsMap: masMap,
  };
}

// Helper function: getKubeFlowInferenceServicesForModelVersion
// Converted from GetKubeFlowInferenceServicesForModelVersion (kfmr.go line 93-108)
export async function getKubeFlowInferenceServicesForModelVersion(
  kfmr: KFMRClient,
  mv: ModelVersion,
): Promise<KFMRInferenceService[]> {
  // List all inference services (Go line 95)
  const isl = await kfmr.listInferenceServices();

  // Filter to only include inference services for this model version (Go line 100-105)
  const mvISL: KFMRInferenceService[] = [];
  for (const is of isl) {
    if (is.modelVersionId && is.modelVersionId === mv.id) {
      mvISL.push(is);
    }
  }

  console.log(
    `getKubeFlowInferenceServicesForModelVersion: total num kubeflow infsvc ${isl.length}, num matched to model version ${mvISL.length}`,
  );
  return mvISL;
}

// Export additional helper functions that may be needed
export { sanitizeName, sanitizeModelVersion };
