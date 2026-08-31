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
import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  type ReconcilerConfig,
  type InferenceService,
  type DiscoveryResponse,
  type ModelCatalog,
  sanitizeName,
} from './types';
import { callBackstagePrinters as callKServeBackstagePrinters } from './KServe';
import {
  setupCatalogRoute,
  createCatalogClient,
  CATALOG_MODEL_ANNOTATION,
  CATALOG_SOURCE_ANNOTATION,
} from './Catalog';

const INFERENCE_SERVICE_GROUP = 'serving.kserve.io';
const INFERENCE_SERVICE_VERSION = 'v1beta1';
const INFERENCE_SERVICE_PLURAL = 'inferenceservices';

interface ModelCardMetadata {
  content: string;
  resourceVersion: string;
  updateCount: number;
  needToUpdate: boolean;
}

// Stores model card content indexed by modelCardKey
const modelCards = new Map<string, ModelCardMetadata>();

interface ModelCatalogMetadata {
  catalogData: ModelCatalog;
  resourceVersion: string;
  updateCount: number;
  needToUpdate: boolean;
}

// Stores model catalog data indexed by importKey
const modelCatalog = new Map<string, ModelCatalogMetadata>();

const INF_SVC_IngressReady_CONDITION = 'IngressReady';
const INF_SVC_PredictorReady_CONDITION = 'PredictorReady';
const INF_SVC_Ready_CONDITION = 'Ready';

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

// When auth is configured, a service account is created whose name is prefixed with
// the inference service's name, and with the inference service set as an owner reference
async function getAuthentication(
  coreClient: k8s.CoreV1Api | undefined,
  namespace: string,
  inferenceServiceName: string,
  logger: LoggerService,
): Promise<boolean> {
  if (!coreClient) {
    logger.debug(
      `getAuthentication: No coreClient available for ${namespace}/${inferenceServiceName}`,
    );
    return false;
  }

  try {
    const response = await coreClient.listNamespacedServiceAccount(namespace);
    const found = response.body.items.some(sa =>
      sa.metadata?.ownerReferences?.some(
        ref =>
          ref.kind === 'InferenceService' && ref.name === inferenceServiceName,
      ),
    );

    if (found) {
      logger.debug(
        `getAuthentication: Found ServiceAccount with InferenceService owner reference for ${namespace}/${inferenceServiceName}`,
      );
    }

    return found;
  } catch (error) {
    logger.error(
      `getAuthentication: Error listing ServiceAccounts for ${namespace}/${inferenceServiceName}`,
      error as Error,
    );
  }

  return false;
}

// First tries the informer cache, then falls back to API if cache is empty
async function listInferenceServices(
  client: k8s.CustomObjectsApi,
  logger: LoggerService,
  informer?: k8s.Informer<InferenceService> & k8s.ObjectCache<InferenceService>,
): Promise<InferenceService[]> {
  if (informer) {
    const cachedList = informer.list() as InferenceService[];
    if (cachedList?.length > 0) {
      logger.debug(
        `listInferenceServices: Got ${cachedList.length} InferenceServices from informer cache`,
      );
      return cachedList;
    }
  }

  logger.debug(
    'listInferenceServices: Informer cache empty, falling back to API',
  );
  try {
    const response = await client.listNamespacedCustomObject(
      INFERENCE_SERVICE_GROUP,
      INFERENCE_SERVICE_VERSION,
      '',
      INFERENCE_SERVICE_PLURAL,
    );

    const items = (response.body as any).items as InferenceService[];
    logger.debug(
      `listInferenceServices: Got ${
        items?.length || 0
      } InferenceServices from API`,
    );
    return items || [];
  } catch (error) {
    logger.error(
      'listInferenceServices: Error listing from API',
      error as Error,
    );
    return [];
  }
}

function isInferenceServiceReady(
  is: InferenceService,
  logger: LoggerService,
): boolean {
  const id = `${is.metadata.namespace}/${is.metadata.name}`;

  if (!is.status) {
    logger.debug(`InferenceService ${id} has no status`);
    return false;
  }

  if (!is.status.conditions?.length) {
    logger.debug(`InferenceService ${id} has no conditions`);
    return false;
  }

  if (is.status.modelStatus?.transitionStatus !== 'UpToDate') {
    logger.debug(
      `InferenceService ${id} transitionStatus is not UpToDate: ${is.status.modelStatus?.transitionStatus}`,
    );
    return false;
  }

  for (const condition of is.status.conditions) {
    if (
      condition.type === INF_SVC_IngressReady_CONDITION ||
      condition.type === INF_SVC_PredictorReady_CONDITION ||
      condition.type === INF_SVC_Ready_CONDITION
    ) {
      if (condition.status !== 'True') {
        logger.debug(
          `InferenceService ${id} condition ${condition.type} is not True: ${condition.status}`,
        );
        return false;
      }
    }
  }

  if (!is.status.url && !is.status.address?.url) {
    logger.debug(`InferenceService ${id} has no URL`);
    return false;
  }

  return true;
}

async function reconcileInferenceService(
  is: InferenceService,
  config: ReconcilerConfig,
): Promise<void> {
  const namespace = is.metadata.namespace;
  const name = is.metadata.name;
  const logger = config.logger!;

  logger.info(`Reconciling InferenceService: ${namespace}/${name}`);

  if (!isInferenceServiceReady(is, logger)) {
    logger.debug(
      `InferenceService ${namespace}/${name} is not ready yet, will retry later`,
    );
    return;
  }

  const authentication = await getAuthentication(
    config.coreClient,
    namespace,
    name,
    logger,
  );

  logger.debug(`Calling backstage printers for ${namespace}/${name}`);
  const catalogData = await callKServeBackstagePrinters(
    config.defaultOwner || 'default-owner',
    config.defaultLifecycle || 'production',
    is,
    authentication,
    logger,
  );
  logger.debug(
    `Generated KServe catalog data with ${
      catalogData.models.length
    } models and ${catalogData.modelServer ? 1 : 0} model servers`,
  );

  const [importKey] = buildImportKeyAndURI(namespace, name);
  logger.debug(`Built importKey: ${importKey}`);

  logger.debug(
    `Processing buffer for ${namespace}/${name} with importKey: ${importKey}`,
  );

  const [modelCardKey, modelCard] = await fetchModelCardViaAnnotations(
    is,
    config,
  );

  const resourceVersion = getResourceVersion(is);

  await processModelCatalog(
    importKey,
    resourceVersion,
    modelCardKey,
    modelCard,
    catalogData,
    logger,
  );

  logger.info(`Successfully reconciled InferenceService: ${namespace}/${name}`);
}

// Use metadata.resourceVersion instead of status condition timestamps
// to detect changes. Kubernetes increments resourceVersion on ANY change
// to a resource, including metadata-only updates (e.g. annotation changes),
// whereas status condition lastTransitionTime only changes when status
// conditions transition.
function getResourceVersion(is: InferenceService): string {
  return is.metadata.resourceVersion ?? '';
}

async function fetchModelCardViaAnnotations(
  is: InferenceService,
  config: ReconcilerConfig,
): Promise<[string, string | undefined]> {
  let modelCardKey = '';
  let modelCard: string | undefined;
  if (is.metadata.annotations && (config.catalogRoute || config.catalogUrl)) {
    const catalogSource = is.metadata.annotations[CATALOG_SOURCE_ANNOTATION];
    const catalogModel = is.metadata.annotations[CATALOG_MODEL_ANNOTATION];
    if (!catalogSource || !catalogModel) {
      return [modelCardKey, modelCard];
    }
    modelCardKey = `${catalogSource}/${catalogModel}`;
    const token = config.serviceAccountToken || '';
    const catalogClient = createCatalogClient(
      config.catalogRoute,
      token,
      config.catalogUrl,
      config.logger,
    );
    try {
      modelCard = await catalogClient?.getModelCard(
        catalogSource,
        catalogModel,
      );
    } catch (error) {
      config.logger?.error(
        'fetchModelCardViaAnnotation: getModelCard error',
        error as Error,
      );
    }
  }
  return [modelCardKey, modelCard];
}

async function processModelCatalog(
  importKey: string,
  resourceVersion: string,
  modelCardKey: string,
  modelCard: string | undefined,
  catalogData: ModelCatalog,
  logger: LoggerService,
): Promise<void> {
  logger.debug(
    `processModelCatalog - key: ${importKey}, resourceVersion: ${resourceVersion}, modelCardKey: ${modelCardKey}`,
  );
  logger.debug(
    `processModelCatalog - catalogData has ${
      catalogData.models.length
    } models and ${catalogData.modelServer ? 1 : 0} model servers`,
  );

  if (importKey) {
    const existingCatalog = modelCatalog.get(importKey);

    if (!existingCatalog) {
      const mcm: ModelCatalogMetadata = {
        catalogData: catalogData,
        resourceVersion: resourceVersion,
        needToUpdate: true,
        updateCount: 0,
      };
      modelCatalog.set(importKey, mcm);
      logger.debug(
        `processModelCatalog: Created new model catalog entry for key ${importKey}`,
      );
    } else if (existingCatalog.resourceVersion !== resourceVersion) {
      existingCatalog.resourceVersion = resourceVersion;
      existingCatalog.catalogData = catalogData;
      existingCatalog.needToUpdate = true;
      existingCatalog.updateCount = 0;
      modelCatalog.set(importKey, existingCatalog);
      logger.debug(
        `processModelCatalog: Updated model catalog entry for key ${importKey} (resourceVersion changed)`,
      );
    } else {
      logger.debug(
        `processModelCatalog: Model catalog for key ${importKey} already up to date`,
      );
    }
  }

  if (modelCardKey && modelCard !== undefined) {
    const existingMcm = modelCards.get(modelCardKey);

    if (!existingMcm) {
      const mcm: ModelCardMetadata = {
        content: modelCard || '',
        resourceVersion: resourceVersion,
        needToUpdate: true,
        updateCount: 0,
      };
      modelCards.set(modelCardKey, mcm);
      logger.debug(
        `processModelCatalog: Created new model card entry for key ${modelCardKey}`,
      );
    } else if (existingMcm.resourceVersion !== resourceVersion) {
      existingMcm.resourceVersion = resourceVersion;
      existingMcm.content = modelCard || existingMcm.content;
      existingMcm.needToUpdate = true;
      existingMcm.updateCount = 0;
      modelCards.set(modelCardKey, existingMcm);
      logger.debug(
        `processModelCatalog: Updated model card entry for key ${modelCardKey} (resourceVersion changed)`,
      );
    } else {
      logger.debug(
        `processModelCatalog: Model card for key ${modelCardKey} already up to date`,
      );
    }
  }
}

// Called on delete events and during background polling to sync the current state.
// Unlike the client-go informer, there is no re-list / re-sync with
// the JavaScript/TypeScript informer.
async function innerStart(
  client: k8s.CustomObjectsApi,
  config: ReconcilerConfig,
): Promise<void> {
  const logger = config.logger!;
  logger.debug('innerStart: Beginning reconciliation sync');

  await setupCatalogRoute(config);

  const keys = new Set<string>();

  logger.debug('innerStart: Listing all KServe InferenceServices');

  try {
    const inferenceServices = await listInferenceServices(
      client,
      logger,
      config.informer,
    );
    logger.debug(
      `innerStart: Found ${inferenceServices.length} KServe InferenceServices`,
    );

    for (const is of inferenceServices) {
      const [importKey] = buildImportKeyAndURI(
        is.metadata.namespace,
        is.metadata.name,
      );
      logger.debug(
        `innerStart: Adding importKey ${importKey} for KServe InferenceService ${is.metadata.namespace}/${is.metadata.name}`,
      );
      keys.add(importKey);
    }
  } catch (error) {
    logger.error(
      'innerStart: Error listing KServe InferenceServices',
      error as Error,
    );
  }

  // Clean up stale entries from modelCatalog
  const keysToDelete: string[] = [];
  for (const catalogKey of modelCatalog.keys()) {
    if (!keys.has(catalogKey)) {
      logger.debug(
        `innerStart: Model catalog key ${catalogKey} no longer exists in current keys, marking for deletion`,
      );
      keysToDelete.push(catalogKey);
    }
  }

  for (const keyToDelete of keysToDelete) {
    modelCatalog.delete(keyToDelete);
    logger.debug(
      `innerStart: Deleted stale model catalog entry: ${keyToDelete}`,
    );
  }

  if (keysToDelete.length > 0) {
    logger.info(
      `innerStart: Cleaned up ${keysToDelete.length} stale model catalog entries`,
    );
  }

  logger.debug('innerStart: Reconciliation sync complete');
}

export function getDiscoveryUris(): DiscoveryResponse {
  const uris: string[] = [];

  for (const [uri, metadata] of modelCatalog.entries()) {
    if (metadata.catalogData) {
      uris.push(uri);
    }
  }

  return { uris };
}

export function getModelCatalog(id: string): ModelCatalog | undefined {
  return modelCatalog.get(id)?.catalogData;
}

export function getModelCard(id: string): string | undefined {
  return modelCards.get(id)?.content;
}

function buildKubeConfig(
  config: ReconcilerConfig,
  logger: LoggerService,
): k8s.KubeConfig {
  const kc = new k8s.KubeConfig();
  const clusterName = config.clusterName || 'target-cluster';

  if (config.url && config.serviceAccountToken) {
    if (config.skipTLSVerify) {
      logger.warn(
        `skipTLSVerify is enabled for cluster '${clusterName}' — TLS certificate validation is disabled, exposing the service account token to MITM interception`,
      );
    }
    logger.info(
      `Building KubeConfig from app-config fields for cluster '${clusterName}' at ${config.url}`,
    );
    kc.loadFromOptions({
      clusters: [
        {
          name: clusterName,
          server: config.url,
          skipTLSVerify: config.skipTLSVerify ?? false,
          caData: config.caData,
        },
      ],
      users: [
        {
          name: 'backstage-sa',
          token: config.serviceAccountToken,
        },
      ],
      contexts: [
        {
          name: clusterName,
          cluster: clusterName,
          user: 'backstage-sa',
        },
      ],
      currentContext: clusterName,
    });
  } else {
    if (config.url || config.serviceAccountToken) {
      logger.warn(
        'Partial K8s config: both url and serviceAccountToken are required for config-based auth; falling back to loadFromDefault()',
      );
    }
    logger.info(
      'No config-based K8s credentials; using loadFromDefault() (KUBECONFIG env, ~/.kube/config, or oc login)',
    );
    kc.loadFromDefault();

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
    if (process.env.K8S_TOKEN) {
      k8sToken = process.env.K8S_TOKEN;
    }
    config.serviceAccountToken = k8sToken;
  }

  return kc;
}

function registerInformerHandlers(
  informer: k8s.Informer<InferenceService> & k8s.ObjectCache<InferenceService>,
  client: k8s.CustomObjectsApi,
  config: ReconcilerConfig,
): void {
  const logger = config.logger!;

  informer.on('add', async (obj: InferenceService) => {
    logger.debug(
      `Added: ${obj.metadata.name} in namespace ${obj.metadata.namespace}`,
    );
    try {
      await reconcileInferenceService(obj, config);
    } catch (error) {
      logger.error(
        `Error reconciling InferenceService ${obj.metadata.namespace}/${obj.metadata.name}`,
        error as Error,
      );
    }
  });

  informer.on('update', async (obj: InferenceService) => {
    logger.debug(
      `Updated: ${obj.metadata.name} in namespace ${obj.metadata.namespace}`,
    );
    try {
      await reconcileInferenceService(obj, config);
    } catch (error) {
      logger.error(
        `Error reconciling InferenceService ${obj.metadata.namespace}/${obj.metadata.name}`,
        error as Error,
      );
    }
  });

  informer.on('delete', async (obj: InferenceService) => {
    logger.debug(
      `Deleted: ${obj.metadata.name} in namespace ${obj.metadata.namespace}`,
    );
    try {
      logger.debug(
        `Initiating delete processing for ${obj.metadata.namespace}/${obj.metadata.name}`,
      );
      await innerStart(client, config);
      logger.debug(
        `Delete processing completed for ${obj.metadata.namespace}/${obj.metadata.name}`,
      );
    } catch (error) {
      logger.error(
        `Error during delete processing for ${obj.metadata.namespace}/${obj.metadata.name}`,
        error as Error,
      );
    }
  });

  informer.on('error', (err: any) => {
    logger.error('Informer error', err as Error);
    setTimeout(() => {
      informer.start();
    }, 5000);
  });
}

function startBackgroundPolling(
  client: k8s.CustomObjectsApi,
  config: ReconcilerConfig,
  logger: LoggerService,
): void {
  const pollingInterval = parseInt(
    process.env.POLLING_INTERVAL || '600000',
    10,
  );

  if (pollingInterval > 0) {
    logger.info(
      `Starting background polling every ${pollingInterval / 1000} seconds`,
    );
    (config.informer as any).__pollingTimer = setInterval(async () => {
      try {
        logger.debug('Background polling: Calling innerStart');
        await innerStart(client, config);
      } catch (error) {
        logger.error(
          'Background polling: Error during innerStart',
          error as Error,
        );
      }
    }, pollingInterval);
  }
}

export const setupInformer = async (
  config: ReconcilerConfig,
  logger: LoggerService,
) => {
  config.logger = logger;

  config.defaultLifecycle =
    config.defaultLifecycle || process.env.LIFECYCLE || 'production';
  config.defaultOwner =
    config.defaultOwner || process.env.OWNER || 'default-owner';

  const kc = buildKubeConfig(config, logger);

  const client = kc.makeApiClient(k8s.CustomObjectsApi);
  const coreClient = kc.makeApiClient(k8s.CoreV1Api);

  config.routeClient = client;
  config.coreClient = coreClient;

  logger.info('Reconciler configuration:', {
    defaultLifecycle: config.defaultLifecycle,
    defaultOwner: config.defaultOwner,
  });

  try {
    await setupCatalogRoute(config);
    logger.info(
      `Catalog route discovered: ${config.catalogRoute ? 'yes' : 'no'}`,
    );
  } catch (error) {
    logger.error('Error setting up catalog route', error as Error);
  }

  const listFn: k8s.ListPromise<InferenceService> = () =>
    client.listClusterCustomObject(
      INFERENCE_SERVICE_GROUP,
      INFERENCE_SERVICE_VERSION,
      INFERENCE_SERVICE_PLURAL,
    ) as any;

  config.informer = k8s.makeInformer(
    kc,
    `/apis/${INFERENCE_SERVICE_GROUP}/${INFERENCE_SERVICE_VERSION}/${INFERENCE_SERVICE_PLURAL}`,
    listFn,
  );

  registerInformerHandlers(config.informer, client, config);

  logger.info('Starting informer for InferenceServices...');
  await config.informer.start();
  logger.info('Informer started.');

  // Background polling supplements the informer since there is no
  // re-list / re-sync in the TypeScript informer.
  startBackgroundPolling(client, config, logger);

  return config.informer;
};
