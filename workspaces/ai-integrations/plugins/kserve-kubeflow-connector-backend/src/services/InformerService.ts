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

import * as k8s from '@kubernetes/client-node';
import {
  type ReconcilerConfig,
  type InferenceService,
  type RegisteredModel,
  type ModelVersion,
  type ModelArtifact,
  type KFMRInferenceService,
  type ServingEnvironment,
  type KServeInferenceService,
  KFMRClient,
  InferenceServiceState,
} from './types';
import { ModelCatalog } from './types'; // '@redhat-ai-dev/model-catalog-types';
import {
  callBackstagePrinters,
  getKubeFlowInferenceServicesForModelVersion,
  loopOverKFMR,
  sanitizeName as kfmrSanitizeName,
  setupKFMR,
} from './Kfmr';
import { callBackstagePrinters as callKServeBackstagePrinters } from './KServe';

const inference_service_group = 'serving.kserve.io';
const inference_service_version = 'v1beta1';
const inference_service_plural = 'inferenceservices';

// Re-export route constants for backwards compatibility
export { route_group, route_version, route_plural } from './types';

// Model card metadata interface (from server.go line 30-35)
interface ModelCardMetadata {
  content: string;
  lastUpdateTimeSinceEpoch: string;
  updateCount: number;
  needToUpdate: boolean;
}

// Global model cards storage (from server.go line 23)
// This stores model card content indexed by modelCardKey
const modelCards = new Map<string, ModelCardMetadata>();

// Model catalog metadata interface
interface ModelCatalogMetadata {
  catalogData: ModelCatalog;
  lastUpdateTimeSinceEpoch: string;
  normalizerType: NormalizerType;
  updateCount: number;
  needToUpdate: boolean;
}

// Global model catalog storage
// This stores model catalog data indexed by importKey
const modelCatalog = new Map<string, ModelCatalogMetadata>();

// Constants for condition types (matching Go constants from bridgerest package)
const INF_SVC_IngressReady_CONDITION = 'IngressReady';
const INF_SVC_PredictorReady_CONDITION = 'PredictorReady';
const INF_SVC_Ready_CONDITION = 'Ready';

// Label constants for KFMR-managed InferenceServices
const INF_SVC_RM_ID_LABEL = 'modelregistry.opendatahub.io/registered-model-id';
const INF_SVC_MV_ID_LABEL = 'modelregistry.opendatahub.io/model-version-id';
// const INF_SVC_INF_SVC_ID_LABEL =
//  'modelregistry.opendatahub.io/inference-service-id';

// Normalizer types
enum NormalizerType {
  KubeflowNormalizer = 'kubeflow',
  KServeNormalizer = 'kserve',
}

// Types are imported from ./types to avoid circular dependencies
// Re-export for backwards compatibility
export type {
  Route,
  RouteIngress,
  RouteStatus,
  ReconcilerConfig,
} from './types';

// Result type for processKFMR
interface ProcessKFMRResult {
  importKey: string;
  lastUpdateTimeSinceEpoch: string;
  modelCardKey: string;
  modelCard?: string;
  catalogData: ModelCatalog;
}

// Helper function to sanitize names (matching Go util.SanitizeName)
function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// Helper function to build import key (matching Go util.BuildImportKeyAndURI)
function buildImportKeyAndURI(
  namespace: string,
  name: string,
  // format: string,
): [string, string] {
  const sanitizedNs = sanitizeName(namespace);
  const sanitizedName = sanitizeName(name);
  const importKey = `${sanitizedNs}/${sanitizedName}`;
  const uri = `/models/${importKey}`;
  return [importKey, uri];
}

// Helper function to get authentication status for an InferenceService
// Converted from Go GetAuthentication method (kserve.go line 358-382)
// When auth is configured, a service account is created whose name is prefixed with
// the inference service's name, and with the inference service set as an owner reference
async function getAuthentication(
  coreClient: k8s.CoreV1Api | undefined,
  namespace: string,
  inferenceServiceName: string,
): Promise<boolean> {
  if (!coreClient) {
    console.log(
      `getAuthentication: No coreClient available for ${namespace}/${inferenceServiceName}`,
    );
    return false;
  }

  try {
    const response = await coreClient.listNamespacedServiceAccount(namespace);
    const saList = response.body.items;

    for (const sa of saList) {
      if (!sa.metadata?.ownerReferences) {
        continue;
      }

      for (const ownerRef of sa.metadata.ownerReferences) {
        if (
          ownerRef.kind === 'InferenceService' &&
          ownerRef.name === inferenceServiceName
        ) {
          console.log(
            `getAuthentication: Found ServiceAccount ${sa.metadata.name} with InferenceService owner reference for ${namespace}/${inferenceServiceName}`,
          );
          return true;
        }
      }
    }
  } catch (error) {
    console.error(
      `getAuthentication: Error listing ServiceAccounts for ${namespace}/${inferenceServiceName}:`,
      error,
    );
  }

  return false;
}

// Helper function to list InferenceServices from informer cache or API
// First tries the informer cache, then falls back to API if cache is empty
async function listInferenceServices(
  client: k8s.CustomObjectsApi,
  informer?: k8s.Informer<InferenceService> & k8s.ObjectCache<InferenceService>,
  labelFilter?: { [key: string]: string },
): Promise<InferenceService[]> {
  // First try to get from informer cache
  if (informer) {
    const cachedList = informer.list() as InferenceService[];
    if (cachedList && cachedList.length > 0) {
      console.log(
        `listInferenceServices: Got ${cachedList.length} InferenceServices from informer cache`,
      );

      // Apply label filter if provided
      if (labelFilter && Object.keys(labelFilter).length > 0) {
        const filtered = cachedList.filter(is => {
          if (!is.metadata.labels) return false;
          for (const [key, value] of Object.entries(labelFilter)) {
            if (is.metadata.labels[key] !== value) {
              return false;
            }
          }
          return true;
        });
        console.log(
          `listInferenceServices: Filtered to ${filtered.length} InferenceServices by labels`,
        );
        if (filtered.length > 0) {
          return filtered;
        }
      } else {
        return cachedList;
      }
    }
  }

  // Fall back to API call
  console.log(
    'listInferenceServices: Informer cache empty, falling back to API',
  );
  try {
    // Build label selector string if filter provided
    let labelSelector: string | undefined;
    if (labelFilter && Object.keys(labelFilter).length > 0) {
      labelSelector = Object.entries(labelFilter)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
    }

    const response = await client.listNamespacedCustomObject(
      inference_service_group,
      inference_service_version,
      '',
      inference_service_plural,
      undefined,
      undefined,
      undefined,
      undefined,
      labelSelector,
    );

    const items = (response.body as any).items as InferenceService[];
    console.log(
      `listInferenceServices: Got ${
        items?.length || 0
      } InferenceServices from API`,
    );
    return items || [];
  } catch (error) {
    console.error('listInferenceServices: Error listing from API:', error);
    return [];
  }
}

// Helper function to check if KServe InferenceService maps to KFMR model
// Converted from Go util.KServeInferenceServiceMapping (utils.go line 123)
function kserveInferenceServiceMapping(
  registeredModelId: string,
  modelVersionId: string,
  is: InferenceService,
): boolean {
  // Check if labels exist (Go line 124-126)
  if (!is.metadata.labels) {
    return false;
  }

  // Check registered model ID label (Go line 128-135)
  const rmVal = is.metadata.labels[INF_SVC_RM_ID_LABEL];
  if (!rmVal) {
    return false;
  }

  if (registeredModelId.trim() !== rmVal.trim()) {
    return false;
  }

  // Check model version ID label (Go line 137-144)
  const mvVal = is.metadata.labels[INF_SVC_MV_ID_LABEL];
  if (!mvVal) {
    return false;
  }

  if (modelVersionId.trim() !== mvVal.trim()) {
    return false;
  }

  // All checks passed (Go line 146)
  return true;
}

// Process KFMR (KubeFlow Model Registry) integration
// Converted from Go processKFMR method (controller.go line 442)
async function processKFMR(
  namespace: string,
  name: string,
  is: InferenceService,
  config: ReconcilerConfig,
): Promise<ProcessKFMRResult | null> {
  console.log(`processKFMR: Processing ${namespace}/${name}`);

  // Check if KFMR is configured (Go line 444-448)
  if (config.kfmrClients.size === 0) {
    console.log(
      `processKFMR: No KFMR routes configured for ${namespace}/${name}`,
    );
    return null;
  }

  console.log(`processKFMR: Have KFMR clients for ${namespace}/${name}`);
  const replacer = (str: string) => str.replace(/ /g, ''); // Go line 451

  const kfmrRMs: RegisteredModel[] = [];
  const kfmrISs: KFMRInferenceService[] = [];

  // Loop over KFMR clients (Go line 455)
  for (const [key, kfmr] of config.kfmrClients.entries()) {
    try {
      // List registered models (Go line 456)
      const rms = await kfmr.listRegisteredModels();
      console.log(
        `processKFMR: Found ${rms.length} registered models with registry ${key}`,
      );
      kfmrRMs.push(...rms);

      // List inference services (Go line 464)
      const iss = await kfmr.listInferenceServices();
      console.log(
        `processKFMR: Found ${iss.length} inference services from ${key}`,
      );
      kfmrISs.push(...iss);
    } catch (error) {
      console.error(
        `processKFMR: Error listing models or services for ${namespace}/${name}:`,
        error,
      );
      continue;
    }

    // Path 1: No KubeFlow inference services - match by model/version name (Go line 472)
    if (kfmrISs.length === 0) {
      console.log(
        `processKFMR: No KubeFlow inference services for registry ${key}`,
      );

      for (const rm of kfmrRMs) {
        if (!rm.id) continue;

        try {
          // List model versions (Go line 476)
          const mvs = await kfmr.listModelVersions(rm.id);
          console.log(
            `processKFMR: Found ${mvs.length} model versions for registered model ${rm.id}`,
          );

          for (const mv of mvs) {
            if (!mv.id) continue;

            // Check if KServe InferenceService maps to this model version (Go line 482)
            if (kserveInferenceServiceMapping(rm.id, mv.id, is)) {
              console.log(
                `processKFMR: Found mapping between KServe IS and model version ${mv.id}`,
              );

              // Get model artifacts (Go line 485)
              let mas: ModelArtifact[] = [];
              try {
                mas = await kfmr.listModelArtifacts(mv.id);
                console.log(
                  `processKFMR: Found ${mas.length} model artifacts for model version ${mv.id}`,
                );
              } catch (error) {
                console.error(
                  `processKFMR: Error getting model artifacts for ${mv.id}:`,
                  error,
                );
              }

              if (!mas || mas.length === 0) {
                console.log(
                  `processKFMR: No model artifacts, bypassing backstage printers`,
                );
                continue;
              }

              // Get authentication status for the KServe InferenceService
              const authentication = await getAuthentication(
                config.coreClient,
                is.metadata.namespace,
                is.metadata.name,
              );

              // Call backstage printers (Go line 497)
              const catalogData: ModelCatalog = await callBackstagePrinters(
                config.defaultOwner,
                config.defaultLifecycle,
                rm,
                mv,
                mas,
                null,
                is as KServeInferenceService,
                authentication,
              );
              console.log(
                `processKFMR: Generated catalog data with ${
                  catalogData.models.length
                } models and ${catalogData.modelServer ? 1 : 0} model servers`,
              );

              // Build import key (Go line 515)
              const [importKey] = buildImportKeyAndURI(
                sanitizeName(rm.name),
                sanitizeName(mv.name),
              );

              // Get last update timestamp (Go line 516)
              let lastUpdateTimeSinceEpoch = mv.lastUpdateTimeSinceEpoch || '';
              if (
                rm.lastUpdateTimeSinceEpoch &&
                rm.lastUpdateTimeSinceEpoch > lastUpdateTimeSinceEpoch
              ) {
                lastUpdateTimeSinceEpoch = rm.lastUpdateTimeSinceEpoch;
              }

              // Get model card if catalog URL exists (Go line 522)
              let modelCard: string | undefined;
              let modelCardKey = '';
              if (kfmr.rootCatalogURL) {
                for (const ma of mas) {
                  if (
                    ma.modelSourceClass &&
                    ma.modelSourceGroup &&
                    ma.modelSourceName
                  ) {
                    try {
                      modelCard = await kfmr.getModelCard(
                        ma.modelSourceClass,
                        ma.modelSourceGroup,
                        ma.modelSourceName,
                      );
                      modelCardKey =
                        replacer(ma.modelSourceClass) +
                        replacer(ma.modelSourceGroup) +
                        replacer(ma.modelSourceName);
                      console.log(
                        `processKFMR: Built modelCardKey ${modelCardKey}`,
                      );
                      break;
                    } catch (error) {
                      console.error(
                        `processKFMR: Error getting model card:`,
                        error,
                      );
                    }
                  }
                }
              }

              return {
                importKey,
                lastUpdateTimeSinceEpoch,
                modelCardKey,
                modelCard,
                catalogData,
              };
            }
          }
        } catch (error) {
          console.error(
            `processKFMR: Error listing model versions for ${rm.id}:`,
            error,
          );
        }
      }
    }

    // Path 2: Found KubeFlow inference services - match with KServe (Go line 542)
    console.log(
      `processKFMR: Found KubeFlow inference services while processing KServe IS ${namespace}/${name}`,
    );

    for (const rm of kfmrRMs) {
      if (!rm.id) {
        console.log(
          `processKFMR: Registered model ${rm.name} has no ID, skipping`,
        );
        continue;
      }

      for (const kfmrIS of kfmrISs) {
        // Check if KubeFlow IS matches registered model and KServe IS name (Go line 551)
        if (
          kfmrIS.id &&
          kfmrIS.registeredModelId === rm.id &&
          kfmrIS.name &&
          is.metadata.name.startsWith(kfmrIS.name)
        ) {
          console.log(
            `processKFMR: KServe IS name match, checking namespace ${namespace} and serving environment ${kfmrIS.servingEnvironmentId}`,
          );

          if (!kfmrIS.servingEnvironmentId) continue;

          // Get serving environment (Go line 556)
          let se: ServingEnvironment;
          try {
            se = await kfmr.getServingEnvironment(kfmrIS.servingEnvironmentId);
          } catch (error) {
            console.error(
              `processKFMR: Error getting serving environment ${kfmrIS.servingEnvironmentId}:`,
              error,
            );
            continue;
          }

          // Check if serving environment name matches namespace (Go line 562)
          if (se.name === namespace) {
            console.log(`processKFMR: Matched KServe IS ${namespace}/${name}`);

            if (!kfmrIS.modelVersionId) continue;

            // Get model version (Go line 569)
            let mv: ModelVersion;
            try {
              mv = await kfmr.getModelVersion(kfmrIS.modelVersionId);
            } catch (error) {
              console.error(
                `processKFMR: Error getting model version ${kfmrIS.modelVersionId}:`,
                error,
              );
              continue;
            }

            // Get model artifacts (Go line 574)
            let mas: ModelArtifact[] = [];
            try {
              mas = await kfmr.listModelArtifacts(kfmrIS.modelVersionId);
            } catch (error) {
              console.error(
                `processKFMR: Error getting model artifacts for ${kfmrIS.modelVersionId}:`,
                error,
              );
            }

            if (!mv || !mas || mas.length === 0) {
              console.log(
                `processKFMR: Missing model version or artifacts, bypassing backstage printers`,
              );
              continue;
            }

            // Get authentication status for the KServe InferenceService
            const authentication = await getAuthentication(
              config.coreClient,
              is.metadata.namespace,
              is.metadata.name,
            );

            // Call backstage printers (Go line 585)
            const catalogData: ModelCatalog = await callBackstagePrinters(
              config.defaultOwner,
              config.defaultLifecycle,
              rm,
              mv,
              mas,
              kfmrIS as KFMRInferenceService,
              is as KServeInferenceService,
              authentication,
            );
            console.log(
              `processKFMR: Generated catalog data with ${
                catalogData.models.length
              } models and ${catalogData.modelServer ? 1 : 0} model servers`,
            );

            // Build import key (Go line 602)
            const [importKey] = buildImportKeyAndURI(
              sanitizeName(rm.name),
              sanitizeName(mv.name),
            );

            // Get last update timestamp (Go line 603)
            let lastUpdateTimeSinceEpoch = mv.lastUpdateTimeSinceEpoch || '';
            if (
              rm.lastUpdateTimeSinceEpoch &&
              rm.lastUpdateTimeSinceEpoch > lastUpdateTimeSinceEpoch
            ) {
              lastUpdateTimeSinceEpoch = rm.lastUpdateTimeSinceEpoch;
            }

            // Get model card if catalog URL exists (Go line 609)
            let modelCard: string | undefined;
            let modelCardKey = '';
            if (kfmr.rootCatalogURL) {
              for (const ma of mas) {
                if (
                  ma.modelSourceClass &&
                  ma.modelSourceGroup &&
                  ma.modelSourceName
                ) {
                  try {
                    modelCard = await kfmr.getModelCard(
                      ma.modelSourceClass,
                      ma.modelSourceGroup,
                      ma.modelSourceName,
                    );
                    modelCardKey = ma.modelSourceGroup + ma.modelSourceName;
                    console.log(
                      `processKFMR: Built modelCardKey ${modelCardKey}`,
                    );
                    break;
                  } catch (error) {
                    console.error(
                      `processKFMR: Error getting model card:`,
                      error,
                    );
                  }
                }
              }
            }

            console.log(
              `processKFMR: KServe IS ${namespace}/${name} returning importKey ${importKey}`,
            );
            return {
              importKey,
              lastUpdateTimeSinceEpoch,
              modelCardKey,
              modelCard,
              catalogData,
            };
          }
        }
      }
    }
  }

  // No match found, but not an error - caller can process as KServe-only (Go line 633)
  console.log(`processKFMR: No KFMR match for ${namespace}/${name}`);
  return null;
}

// Helper function to check if InferenceService status is ready
function isInferenceServiceReady(is: InferenceService): boolean {
  if (!is.status) {
    console.log(
      `InferenceService ${is.metadata.namespace}/${is.metadata.name} has no status`,
    );
    return false;
  }

  // Check if conditions exist
  if (!is.status.conditions || is.status.conditions.length === 0) {
    console.log(
      `InferenceService ${is.metadata.namespace}/${is.metadata.name} has no conditions`,
    );
    return false;
  }

  // Check model status transition status
  if (is.status.modelStatus?.transitionStatus !== 'UpToDate') {
    console.log(
      `InferenceService ${is.metadata.namespace}/${is.metadata.name} transitionStatus is not UpToDate: ${is.status.modelStatus?.transitionStatus}`,
    );
    return false;
  }

  // Check required conditions
  for (const condition of is.status.conditions) {
    if (
      condition.type === INF_SVC_IngressReady_CONDITION ||
      condition.type === INF_SVC_PredictorReady_CONDITION ||
      condition.type === INF_SVC_Ready_CONDITION
    ) {
      if (condition.status !== 'True') {
        console.log(
          `InferenceService ${is.metadata.namespace}/${is.metadata.name} condition ${condition.type} is not True: ${condition.status}`,
        );
        return false;
      }
    }
  }

  // Check URL exists
  if (!is.status.url && !is.status.address?.url) {
    console.log(
      `InferenceService ${is.metadata.namespace}/${is.metadata.name} has no URL`,
    );
    return false;
  }

  return true;
}

// Main reconciliation logic (converted from Go Reconcile method starting at line 366)
async function reconcileInferenceService(
  is: InferenceService,
  config: ReconcilerConfig,
): Promise<void> {
  const namespace = is.metadata.namespace;
  const name = is.metadata.name;

  console.log(`Reconciling InferenceService: ${namespace}/${name}`);

  // Variables to track the reconciliation state
  let importKey = '';
  let lastUpdateTimeSinceEpoch = '';
  let modelCardKey = '';
  let modelCard: string | undefined;
  let catalogData: ModelCatalog | undefined;
  let normalizerType = NormalizerType.KubeflowNormalizer;

  // Step 1: Process KFMR if routes are available (line 365-369 in Go)
  if (config.kfmrClients.size > 0) {
    console.log(`Processing KFMR for ${namespace}/${name}`);
    const result = await processKFMR(namespace, name, is, config);
    if (result) {
      importKey = result.importKey;
      lastUpdateTimeSinceEpoch = result.lastUpdateTimeSinceEpoch;
      modelCardKey = result.modelCardKey;
      modelCard = result.modelCard;
      catalogData = result.catalogData;
    }
  }

  // Step 2: Handle KServe-only scenario if no importKey (lines 371-408 in Go)
  if (!importKey) {
    console.log(`Processing KServe-only mode for ${namespace}/${name}`);
    normalizerType = NormalizerType.KServeNormalizer;

    // Wait for status to reach a functional, ready state
    if (!isInferenceServiceReady(is)) {
      console.log(
        `InferenceService ${namespace}/${name} is not ready yet, will retry later`,
      );
      // In a real implementation, this would requeue the reconciliation
      return;
    }

    // Get authentication status by checking for ServiceAccount with InferenceService owner reference
    const authentication = await getAuthentication(
      config.coreClient,
      namespace,
      name,
    );

    // Call backstage printers (equivalent to kserve.CallBackstagePrinters in Go)
    console.log(`Calling backstage printers for ${namespace}/${name}`);
    catalogData = await callKServeBackstagePrinters(
      config.defaultOwner,
      config.defaultLifecycle,
      is,
      authentication,
    );
    console.log(
      `Generated KServe catalog data with ${
        catalogData.models.length
      } models and ${catalogData.modelServer ? 1 : 0} model servers`,
    );

    // Build import key
    [importKey] = buildImportKeyAndURI(namespace, name);
    console.log(`Built importKey: ${importKey}`);
  }

  // Step 3: Process buffer and send to storage (lines 410-413 in Go)
  if (!catalogData) {
    console.error(
      `No catalog data available for ${namespace}/${name}, skipping processModelCatalog`,
    );
    return;
  }

  console.log(
    `Processing buffer for ${namespace}/${name} with importKey: ${importKey}`,
  );
  await processModelCatalog(
    importKey,
    normalizerType,
    lastUpdateTimeSinceEpoch,
    modelCardKey,
    modelCard,
    catalogData,
  );

  console.log(`Successfully reconciled InferenceService: ${namespace}/${name}`);
}

// Helper function to process buffer and send to storage (matching Go processBWriter)
async function processModelCatalog(
  importKey: string,
  normalizerType: NormalizerType,
  lastUpdateTimeSinceEpoch: string,
  modelCardKey: string,
  modelCard: string | undefined,
  catalogData: ModelCatalog,
): Promise<void> {
  console.log(
    `processModelCatalog - key: ${importKey}, type: ${normalizerType}, epoch: ${lastUpdateTimeSinceEpoch}, modelCardKey: ${modelCardKey}`,
  );
  console.log(
    `processModelCatalog - catalogData has ${
      catalogData.models.length
    } models and ${catalogData.modelServer ? 1 : 0} model servers`,
  );

  // Handle model catalog storage
  if (importKey && importKey.length > 0) {
    const existingCatalog = modelCatalog.get(importKey);

    if (!existingCatalog) {
      // Create new model catalog metadata entry
      const mcm: ModelCatalogMetadata = {
        catalogData: catalogData,
        lastUpdateTimeSinceEpoch: lastUpdateTimeSinceEpoch,
        normalizerType: normalizerType,
        needToUpdate: true,
        updateCount: 0,
      };
      modelCatalog.set(importKey, mcm);
      console.log(
        `processModelCatalog: Created new model catalog entry for key ${importKey}`,
      );
    } else {
      // Update existing model catalog metadata if timestamp changed
      if (
        existingCatalog.lastUpdateTimeSinceEpoch !== lastUpdateTimeSinceEpoch
      ) {
        existingCatalog.lastUpdateTimeSinceEpoch = lastUpdateTimeSinceEpoch;
        existingCatalog.catalogData = catalogData;
        existingCatalog.normalizerType = normalizerType;
        existingCatalog.needToUpdate = true;
        existingCatalog.updateCount = 0;
        modelCatalog.set(importKey, existingCatalog);
        console.log(
          `processModelCatalog: Updated model catalog entry for key ${importKey} (timestamp changed)`,
        );
      } else {
        console.log(
          `processModelCatalog: Model catalog for key ${importKey} already up to date`,
        );
      }
    }
  }

  // Handle model card storage (converted from server.go lines 219-234)
  if (modelCardKey && modelCardKey.length > 0) {
    const existingMcm = modelCards.get(modelCardKey);

    if (!existingMcm) {
      // Create new model card metadata entry
      const mcm: ModelCardMetadata = {
        content: modelCard || '',
        lastUpdateTimeSinceEpoch: lastUpdateTimeSinceEpoch,
        needToUpdate: true,
        updateCount: 0,
      };
      modelCards.set(modelCardKey, mcm);
      console.log(
        `processModelCatalog: Created new model card entry for key ${modelCardKey}`,
      );
    } else {
      // Update existing model card metadata if timestamp changed
      if (existingMcm.lastUpdateTimeSinceEpoch !== lastUpdateTimeSinceEpoch) {
        existingMcm.lastUpdateTimeSinceEpoch = lastUpdateTimeSinceEpoch;
        existingMcm.content = modelCard || existingMcm.content;
        existingMcm.needToUpdate = true;
        existingMcm.updateCount = 0;
        modelCards.set(modelCardKey, existingMcm);
        console.log(
          `processModelCatalog: Updated model card entry for key ${modelCardKey} (timestamp changed)`,
        );
      } else {
        console.log(
          `processModelCatalog: Model card for key ${modelCardKey} already up to date`,
        );
      }
    }
  }
}

// Helper function to call backstage printers and process model catalog
// Converted from innerStartCallBackstagePrinters (controller.go line 839-878)
async function innerStartCallBackstagePrinters(
  kfmr: KFMRClient,
  rm: RegisteredModel,
  mv: ModelVersion,
  kfmrIS: KFMRInferenceService | null,
  kserveIS: InferenceService | null,
  maa: ModelArtifact[],
  replacer: (str: string) => string,
  importKey: string,
  lastUpdateTimeSinceEpoch: string,
  config: ReconcilerConfig,
  authentication: boolean = false,
): Promise<void> {
  // Call backstage printers (Go line 852)
  const catalogData: ModelCatalog = await callBackstagePrinters(
    config.defaultOwner,
    config.defaultLifecycle,
    rm,
    mv,
    maa,
    kfmrIS as KFMRInferenceService | null,
    kserveIS as KServeInferenceService | null,
    authentication,
  );

  // Get model card if catalog URL exists (Go line 859-870)
  let modelCard: string | undefined;
  let modelCardKey = '';
  if (kfmr.rootCatalogURL) {
    for (const ma of maa) {
      if (ma.modelSourceClass && ma.modelSourceGroup && ma.modelSourceName) {
        try {
          modelCard = await kfmr.getModelCard(
            ma.modelSourceClass,
            ma.modelSourceGroup,
            ma.modelSourceName,
          );
          modelCardKey =
            replacer(ma.modelSourceClass) +
            replacer(ma.modelSourceGroup) +
            replacer(ma.modelSourceName);
          console.log(`innerStart: built modelCardKey ${modelCardKey}`);
          break;
        } catch (error) {
          console.error('innerStart: error getting model card:', error);
        }
      }
    }
  }

  // Process model catalog (Go line 872)
  await processModelCatalog(
    importKey,
    NormalizerType.KubeflowNormalizer,
    lastUpdateTimeSinceEpoch,
    modelCardKey,
    modelCard,
    catalogData,
  );
}

// Main polling/sync function (converted from Go innerStart method starting at line 651)
// This is called on delete events and during background polling to sync the current state
async function innerStart(
  client: k8s.CustomObjectsApi,
  // coreClient: k8s.CoreV1Api,
  config: ReconcilerConfig,
): Promise<void> {
  console.log('innerStart: Beginning reconciliation sync');

  const updConfig = await setupKFMR(config);

  const keys: string[] = [];

  // Step 1: Process KFMR registries (lines 658-794 in Go)
  const replacer = (str: string) => str.replace(/ /g, '');
  console.log(`innerStart: len kfmr ${updConfig.kfmrClients.size}`);

  for (const [registryKey, kfmr] of updConfig.kfmrClients.entries()) {
    try {
      // Call loopOverKFMR to get registered models, model versions, and model artifacts (Go line 664)
      const { registeredModels, modelVersionsMap, modelArtifactsMap } =
        await loopOverKFMR(kfmr as KFMRClient);

      console.log(
        `innerStart: len rms ${registeredModels.length} mvs ${modelVersionsMap.size} mas ${modelArtifactsMap.size}`,
      );

      // Process each registered model (Go line 670)
      for (const rm of registeredModels) {
        const rmNameKey = kfmrSanitizeName(rm.name);

        // Get model versions for this registered model (Go line 671)
        const mva = modelVersionsMap.get(rmNameKey);
        if (!mva) {
          console.log(`innerStart: mvs rm disconnect ${rm.name}`);
          continue;
        }

        // Get model artifacts map for this registered model (Go line 676)
        const maa = modelArtifactsMap.get(rmNameKey);
        if (!maa) {
          console.log(`innerStart: mas rm disconnect ${rm.name}`);
          continue;
        }

        let foundKServe = false;

        // Process each model version (Go line 682)
        for (const mv of mva) {
          if (!mv.id) continue;

          // Build import key (Go line 684)
          const [importKey] = buildImportKeyAndURI(
            kfmrSanitizeName(rm.name),
            kfmrSanitizeName(mv.name),
          );
          console.log(
            `innerStart: importKey ${importKey} from rm ${rm.name} mv ${mv.name}`,
          );

          // Get last update timestamp (Go line 686-688)
          let lastUpdateTimeSinceEpoch = mv.lastUpdateTimeSinceEpoch || '';
          if (
            rm.lastUpdateTimeSinceEpoch &&
            rm.lastUpdateTimeSinceEpoch > lastUpdateTimeSinceEpoch
          ) {
            lastUpdateTimeSinceEpoch = rm.lastUpdateTimeSinceEpoch;
          }

          // Add import key to keys array (Go line 690)
          keys.push(importKey);

          // Get model artifacts for this model version
          const mvArtifacts = maa.get(mv.id) || [];

          // Get KubeFlow inference services for this model version (Go line 700-701)
          let mvISL: KFMRInferenceService[] = [];
          try {
            mvISL = await getKubeFlowInferenceServicesForModelVersion(
              kfmr as KFMRClient,
              mv,
            );
          } catch (error) {
            console.error(
              'innerStart: error listing kubeflow inference services:',
              error,
            );
            continue;
          }

          // If no KubeFlow inference services, call backstage printers without KServe (Go line 706-722)
          if (mvISL.length === 0) {
            try {
              // No KServe InferenceService, so authentication is false
              await innerStartCallBackstagePrinters(
                kfmr as KFMRClient,
                rm,
                mv,
                null,
                null,
                mvArtifacts,
                replacer,
                importKey,
                lastUpdateTimeSinceEpoch,
                config,
                false,
              );
            } catch (error) {
              console.log(
                `innerStart: callBackstage printers len mvISL 0 error: ${error}`,
              );
            }
            continue;
          }

          // Process each KubeFlow inference service (Go line 724)
          for (const kis of mvISL) {
            // Check if deployed (Go line 725-732)
            if (kis.desiredState !== InferenceServiceState.Deployed) {
              console.log(
                `innerStart: kubeflow infsvc ${kis.name} id ${kis.id} not deployed`,
              );
              continue;
            }

            // Find matching KServe inference service by labels (Go line 734-753)
            let kserveIS: InferenceService | null = null;
            const labelFilter = {
              [INF_SVC_RM_ID_LABEL]: rm.id!,
              [INF_SVC_MV_ID_LABEL]: mv.id!,
            };
            const matchingISList = await listInferenceServices(
              client,
              config.informer,
              labelFilter,
            );
            if (matchingISList.length > 0) {
              kserveIS = matchingISList[0];
              console.log(
                `innerStart: found kserve infsvc ${kserveIS.metadata.namespace}:${kserveIS.metadata.name} from rm ${rm.id} mv ${mv.id} kubeflow is ${kis.id}`,
              );
            }

            if (!kserveIS) {
              continue;
            }

            // Get authentication status for the KServe InferenceService
            const authentication = await getAuthentication(
              config.coreClient,
              kserveIS.metadata.namespace,
              kserveIS.metadata.name,
            );

            // Call backstage printers with both KubeFlow and KServe (Go line 759-776)
            try {
              await innerStartCallBackstagePrinters(
                kfmr as KFMRClient,
                rm,
                mv,
                kis,
                kserveIS,
                mvArtifacts,
                replacer,
                importKey,
                lastUpdateTimeSinceEpoch,
                config,
                authentication,
              );
            } catch (error) {
              console.error(
                `innerStart: error from call backstage printers: ${error}`,
              );
            }

            // Break since only one kubeflow infsvc can match to kserve infsvc (Go line 776)
            foundKServe = true;
            break;
          }

          // If no KServe match found, call backstage printers without KServe (Go line 778-791)
          if (!foundKServe) {
            try {
              // No KServe InferenceService, so authentication is false
              await innerStartCallBackstagePrinters(
                kfmr as KFMRClient,
                rm,
                mv,
                null,
                null,
                mvArtifacts,
                replacer,
                importKey,
                lastUpdateTimeSinceEpoch,
                config,
                false,
              );
            } catch (error) {
              console.error(
                `innerStart: error from call backstage printers (no kserve): ${error}`,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(`innerStart: err looping over KFMR ${registryKey}:`, error);
    }
  }

  // Step 2: List all KServe InferenceServices (lines 796-824 in Go)
  console.log('innerStart: Listing all KServe InferenceServices');

  try {
    const inferenceServices = await listInferenceServices(
      client,
      config.informer,
    );
    console.log(
      `innerStart: Found ${inferenceServices.length} KServe InferenceServices`,
    );

    for (const is of inferenceServices) {
      let skip = false;

      // Skip InferenceServices managed by KubeFlow (lines 803-816 in Go)
      if (is.metadata.labels && config.kfmrClients.size > 0) {
        for (const labelKey of Object.keys(is.metadata.labels)) {
          if (
            labelKey === INF_SVC_MV_ID_LABEL ||
            labelKey === INF_SVC_RM_ID_LABEL
          ) {
            console.log(
              `innerStart: Skipping InferenceService ${is.metadata.namespace}/${is.metadata.name} since it is managed by KubeFlow`,
            );
            skip = true;
            break;
          }
        }
      }

      if (!skip) {
        // Build import key for KServe-only InferenceService (line 819)
        const [importKey] = buildImportKeyAndURI(
          is.metadata.namespace,
          is.metadata.name,
        );
        console.log(
          `innerStart: Adding importKey ${importKey} for KServe InferenceService ${is.metadata.namespace}/${is.metadata.name}`,
        );
        keys.push(importKey);
      }
    }
  } catch (error) {
    console.error('innerStart: Error listing KServe InferenceServices:', error);
  }

  // Step 3: Clean up stale entries from modelCatalog (Go lines 826-835)
  // Remove any model catalog entries whose keys are no longer present in the current reconciliation
  const keysToDelete: string[] = [];
  for (const catalogKey of modelCatalog.keys()) {
    if (!keys.includes(catalogKey)) {
      console.log(
        `innerStart: Model catalog key ${catalogKey} no longer exists in current keys, marking for deletion`,
      );
      keysToDelete.push(catalogKey);
    }
  }

  for (const keyToDelete of keysToDelete) {
    modelCatalog.delete(keyToDelete);
    console.log(
      `innerStart: Deleted stale model catalog entry: ${keyToDelete}`,
    );
  }

  if (keysToDelete.length > 0) {
    console.log(
      `innerStart: Cleaned up ${keysToDelete.length} stale model catalog entries`,
    );
  }

  console.log('innerStart: Reconciliation sync complete');
}

export const setupInformer = async () => {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const client = kc.makeApiClient(k8s.CustomObjectsApi);
  const coreClient = kc.makeApiClient(k8s.CoreV1Api);

  let k8sToken: string | undefined = '';
  const currentUser = kc.getCurrentUser();
  if (currentUser !== null) {
    k8sToken = currentUser.token;
  } else {
    const users = kc.getUsers();
    for (const user of users) {
      if (user.token !== null) {
        k8sToken = user.token;
        break;
      }
    }
  }

  // Initialize configuration from environment variables
  const config: ReconcilerConfig = {
    kfmrClients: new Map(),
    kfmrRoutes: new Map(),
    kfmrCatalogRoute: undefined,
    defaultLifecycle: process.env.LIFECYCLE || 'production',
    defaultOwner: process.env.OWNER || 'default-owner',
    k8sToken: k8sToken,
    routeClient: client,
    coreClient: coreClient,
  };

  console.log('Reconciler configuration (before setupKFMR):', {
    defaultLifecycle: config.defaultLifecycle,
    defaultOwner: config.defaultOwner,
    kfmrClients: config.kfmrClients.size,
  });

  // Setup KFMR clients (equivalent to Go line 263: reconciler.setupKFMR(ctx))
  try {
    await setupKFMR(config);
    console.log(
      `Reconciler configuration (after setupKFMR): KFMR clients initialized: ${config.kfmrClients.size}`,
    );
  } catch (error) {
    console.error('Error setting up KFMR:', error);
  }

  const listFn: k8s.ListPromise<InferenceService> = () =>
    client.listClusterCustomObject(
      inference_service_group,
      inference_service_version,
      inference_service_plural,
    ) as any;

  config.informer = k8s.makeInformer(
    kc,
    `/apis/${inference_service_group}/${inference_service_version}/${inference_service_plural}`,
    listFn,
  );

  config.informer.on('add', async (obj: InferenceService) => {
    console.log(
      `Added: ${obj.metadata.name} in namespace ${obj.metadata.namespace}`,
    );

    // Execute the reconciliation logic (converted from Go Reconcile method)
    try {
      await reconcileInferenceService(obj, config);
    } catch (error) {
      console.error(
        `Error reconciling InferenceService ${obj.metadata.namespace}/${obj.metadata.name}:`,
        error,
      );
    }
  });

  config.informer.on('update', async (obj: InferenceService) => {
    console.log(
      `Updated: ${obj.metadata.name} in namespace ${obj.metadata.namespace}`,
    );

    // Execute the reconciliation logic for updates as well
    try {
      await reconcileInferenceService(obj, config);
    } catch (error) {
      console.error(
        `Error reconciling InferenceService ${obj.metadata.namespace}/${obj.metadata.name}:`,
        error,
      );
    }
  });

  config.informer.on('delete', async (obj: InferenceService) => {
    console.log(
      `Deleted: ${obj.metadata.name} in namespace ${obj.metadata.namespace}`,
    );

    // Delete processing: Call innerStart to sync the current state (Go code line 339-351)
    // This will:
    // 1. Poll KFMR to remove URLs/routes from model entries that depended on this InferenceService
    // 2. If the delete resulted from archiving, remove the model from storage
    // 3. Update the current key set to reflect the deletion
    try {
      console.log(
        `Initiating delete processing for ${obj.metadata.namespace}/${obj.metadata.name}`,
      );
      await innerStart(client, /* coreClient,*/ config);
      console.log(
        `Delete processing completed for ${obj.metadata.namespace}/${obj.metadata.name}`,
      );
    } catch (error) {
      console.error(
        `Error during delete processing for ${obj.metadata.namespace}/${obj.metadata.name}:`,
        error,
      );
    }
  });

  config.informer.on('error', (err: any) => {
    console.error('Informer error:', err);
    // Restart informer after a delay
    setTimeout(() => {
      config.informer?.start();
    }, 5000);
  });

  console.log('Starting informer for InferenceServices...');
  await config.informer.start();
  console.log('Informer started.');

  // Optional: Start background polling to supplement the informer
  // This matches the Go Start method (lines 639-649)
  // The controller relist does not duplicate delete events, so background polling
  // provides more fine-grained control over what we attempt to relist
  const pollingInterval = parseInt(
    process.env.POLLING_INTERVAL || '120000',
    10,
  ); // Default 2 minutes

  if (pollingInterval > 0) {
    console.log(
      `Starting background polling every ${pollingInterval / 1000} seconds`,
    );
    // Store the timer in case we need to stop it later
    (config.informer as any).__pollingTimer = setInterval(async () => {
      try {
        console.log('Background polling: Calling innerStart');
        await innerStart(client, /* coreClient,*/ config);
      } catch (error) {
        console.error('Background polling: Error during innerStart:', error);
      }
    }, pollingInterval);
  }

  return config.informer;
};
