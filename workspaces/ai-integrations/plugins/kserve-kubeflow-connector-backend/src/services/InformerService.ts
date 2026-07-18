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
  type DiscoveryResponse,
} from './types';
import { ModelCatalog } from './types';
import { callBackstagePrinters as callKServeBackstagePrinters } from './KServe';
import { setupCatalogRoute } from './Catalog';

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

// Normalizer types
enum NormalizerType {
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

// Helper function to sanitize names (matching Go util.SanitizeName)
function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// Helper function to build import key (matching Go util.BuildImportKeyAndURI)
function buildImportKeyAndURI(
  namespace: string,
  name: string,
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
): Promise<InferenceService[]> {
  // First try to get from informer cache
  if (informer) {
    const cachedList = informer.list() as InferenceService[];
    if (cachedList && cachedList.length > 0) {
      console.log(
        `listInferenceServices: Got ${cachedList.length} InferenceServices from informer cache`,
      );
      return cachedList;
    }
  }

  // Fall back to API call
  console.log(
    'listInferenceServices: Informer cache empty, falling back to API',
  );
  try {
    const response = await client.listNamespacedCustomObject(
      inference_service_group,
      inference_service_version,
      '',
      inference_service_plural,
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

  const normalizerType = NormalizerType.KServeNormalizer;

  // Wait for status to reach a functional, ready state
  if (!isInferenceServiceReady(is)) {
    console.log(
      `InferenceService ${namespace}/${name} is not ready yet, will retry later`,
    );
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
  const catalogData = await callKServeBackstagePrinters(
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
  const [importKey] = buildImportKeyAndURI(namespace, name);
  console.log(`Built importKey: ${importKey}`);

  // Process buffer and send to storage
  console.log(
    `Processing buffer for ${namespace}/${name} with importKey: ${importKey}`,
  );
  await processModelCatalog(
    importKey,
    normalizerType,
    '',
    '',
    undefined,
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

// Main polling/sync function (converted from Go innerStart method starting at line 651)
// This is called on delete events and during background polling to sync the current state
async function innerStart(
  client: k8s.CustomObjectsApi,
  config: ReconcilerConfig,
): Promise<void> {
  console.log('innerStart: Beginning reconciliation sync');

  // Discover the catalog route for future catalog integration
  await setupCatalogRoute(config);

  const keys: string[] = [];

  // List all KServe InferenceServices
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
      // Build import key for KServe InferenceService
      const [importKey] = buildImportKeyAndURI(
        is.metadata.namespace,
        is.metadata.name,
      );
      console.log(
        `innerStart: Adding importKey ${importKey} for KServe InferenceService ${is.metadata.namespace}/${is.metadata.name}`,
      );
      keys.push(importKey);
    }
  } catch (error) {
    console.error('innerStart: Error listing KServe InferenceServices:', error);
  }

  // Clean up stale entries from modelCatalog
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

// Get discovery URIs from model catalog (matching Go handleCatalogDiscoveryGet, server.go lines 162-182)
// Returns all URIs from modelCatalog that have valid catalog data
export function getDiscoveryUris(): DiscoveryResponse {
  const uris: string[] = [];

  // Iterate over model catalog entries
  // Since we cannot delete handlers in some routing frameworks, when we delete a location,
  // rather than removing from the map, we might set contents to null/undefined,
  // so we check for that before deciding to include the URI
  for (const [uri, metadata] of modelCatalog.entries()) {
    // Only include URIs where catalogData exists and is valid
    if (metadata.catalogData) {
      uris.push(uri);
    }
  }

  return { uris };
}

export function getModelCatalog(id: string): ModelCatalog | undefined {
  const mcm = modelCatalog.get(id);
  if (mcm) {
    return mcm.catalogData;
  }
  return undefined;
}

export function getModelCard(id: string): string | undefined {
  const mcm = modelCards.get(id);
  if (mcm) {
    return mcm?.content;
  }
  return undefined;
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
  if (process.env.K8S_TOKEN && process.env.K8S_TOKEN.length > 0) {
    k8sToken = process.env.K8S_TOKEN;
  }

  // Initialize configuration from environment variables
  const config: ReconcilerConfig = {
    catalogRoute: undefined,
    defaultLifecycle: process.env.LIFECYCLE || 'production',
    defaultOwner: process.env.OWNER || 'default-owner',
    k8sToken: k8sToken,
    routeClient: client,
    coreClient: coreClient,
  };

  console.log('Reconciler configuration:', {
    defaultLifecycle: config.defaultLifecycle,
    defaultOwner: config.defaultOwner,
  });

  // Discover catalog route for future catalog integration
  try {
    await setupCatalogRoute(config);
    console.log(
      `Catalog route discovered: ${config.catalogRoute ? 'yes' : 'no'}`,
    );
  } catch (error) {
    console.error('Error setting up catalog route:', error);
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
    // This will update the current key set to reflect the deletion
    try {
      console.log(
        `Initiating delete processing for ${obj.metadata.namespace}/${obj.metadata.name}`,
      );
      await innerStart(client, config);
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
        await innerStart(client, config);
      } catch (error) {
        console.error('Background polling: Error during innerStart:', error);
      }
    }, pollingInterval);
  }

  return config.informer;
};
