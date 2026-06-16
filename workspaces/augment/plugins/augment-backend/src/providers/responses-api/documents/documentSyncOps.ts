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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  DocumentInfo,
  SyncResult,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { toErrorMessage } from '../../../services/utils';
import type { VectorStoreService } from './VectorStoreService';
import type { DocumentIngestionService } from '../../../services/DocumentIngestionService';
import type { DocumentsConfig, FetchedDocument } from '../../../types';
import { generateDefaultAttributes } from '../../../services/utils/documentAttributes';
import { categorizeDocuments } from './SyncCategorizer';

export interface HashCacheOps {
  evictCacheIfNeeded: () => void;
  contentHashCache: Map<string, string>;
  persistHash: (
    fileName: string,
    contentHash: string,
    sourceId?: string,
  ) => Promise<void>;
  evictCacheByFileName: (fileName: string) => void;
  removePersistedHash: (fileName: string) => Promise<void>;
}

export async function uploadNewDocuments(
  docsToAdd: FetchedDocument[],
  vectorStore: VectorStoreService,
  hashOps: HashCacheOps,
  logger: LoggerService,
): Promise<{ addedCount: number; failedCount: number }> {
  if (docsToAdd.length === 0) {
    return { addedCount: 0, failedCount: 0 };
  }

  logger.info(`Uploading ${docsToAdd.length} new documents`);
  const uploadResult = await vectorStore.uploadDocuments(
    docsToAdd.map(d => ({
      fileName: d.fileName,
      content: d.content,
      attributes: d.attributes || generateDefaultAttributes(d),
    })),
  );

  const uploadedNames = new Set(uploadResult.uploaded.map(u => u.fileName));
  for (const doc of docsToAdd) {
    if (doc.contentHash && uploadedNames.has(doc.fileName)) {
      const cacheKey = doc.sourceId || doc.fileName;
      hashOps.evictCacheIfNeeded();
      hashOps.contentHashCache.set(cacheKey, doc.contentHash);
      await hashOps.persistHash(doc.fileName, doc.contentHash, doc.sourceId);
    }
  }

  return {
    addedCount: uploadResult.uploaded.length,
    failedCount: uploadResult.failed.length,
  };
}

export async function updateChangedDocuments(
  docsToUpdate: FetchedDocument[],
  existingDocsMap: Map<string, DocumentInfo>,
  vectorStore: VectorStoreService,
  hashOps: HashCacheOps,
  logger: LoggerService,
): Promise<{ updatedCount: number; failedCount: number }> {
  if (docsToUpdate.length === 0) {
    return { updatedCount: 0, failedCount: 0 };
  }

  logger.info(`Updating ${docsToUpdate.length} changed documents`);

  let updatedCount = 0;
  let failedCount = 0;

  for (const doc of docsToUpdate) {
    const existingDoc = existingDocsMap.get(doc.fileName);
    if (!existingDoc) continue;

    try {
      await vectorStore.deleteDocument(existingDoc.id);

      const uploadResult = await vectorStore.uploadDocuments([
        {
          fileName: doc.fileName,
          content: doc.content,
          attributes: doc.attributes || generateDefaultAttributes(doc),
        },
      ]);

      if (uploadResult.uploaded.length > 0) {
        updatedCount++;
        if (doc.contentHash) {
          const cacheKey = doc.sourceId || doc.fileName;
          hashOps.evictCacheIfNeeded();
          hashOps.contentHashCache.set(cacheKey, doc.contentHash);
          await hashOps.persistHash(
            doc.fileName,
            doc.contentHash,
            doc.sourceId,
          );
        }
      } else {
        failedCount++;
      }
    } catch (error) {
      logger.warn(
        `Failed to update document ${doc.fileName}: ${toErrorMessage(error)}`,
      );
      failedCount++;
    }
  }

  return { updatedCount, failedCount };
}

export async function removeDeletedDocuments(
  config: DocumentsConfig,
  existingDocs: DocumentInfo[],
  fetchedDocs: FetchedDocument[],
  vectorStore: VectorStoreService,
  hashOps: HashCacheOps,
  logger: LoggerService,
): Promise<{ removedCount: number; failedCount: number }> {
  if (config.syncMode !== 'full') {
    return { removedCount: 0, failedCount: 0 };
  }

  const fetchedFileNames = new Set(fetchedDocs.map(d => d.fileName));
  const docsToRemove = existingDocs.filter(
    d => !fetchedFileNames.has(d.fileName),
  );

  if (docsToRemove.length === 0) {
    return { removedCount: 0, failedCount: 0 };
  }

  logger.info(`Removing ${docsToRemove.length} documents no longer in sources`);

  let removedCount = 0;
  let failedCount = 0;

  for (const doc of docsToRemove) {
    try {
      await vectorStore.deleteDocument(doc.id);
      removedCount++;
      hashOps.evictCacheByFileName(doc.fileName);
      await hashOps.removePersistedHash(doc.fileName);
    } catch (error) {
      logger.warn(`Failed to remove document ${doc.fileName}`);
      failedCount++;
    }
  }

  return { removedCount, failedCount };
}

export async function fetchAndCategorize(
  config: DocumentsConfig,
  ingestion: DocumentIngestionService,
  vectorStore: VectorStoreService,
  contentHashCache: Map<string, string>,
  loadHashCache: () => Promise<void>,
  logger: LoggerService,
): Promise<{
  fetchedDocs: FetchedDocument[];
  existingDocs: DocumentInfo[];
  existingDocsMap: Map<string, DocumentInfo>;
  docsToAdd: FetchedDocument[];
  docsToUpdate: FetchedDocument[];
  docsUnchanged: string[];
}> {
  await loadHashCache();

  const fetchedDocs = await ingestion.fetchFromSources(config.sources);
  logger.info(`Fetched ${fetchedDocs.length} documents from sources`);

  const existingDocs = await vectorStore.listDocuments();
  const existingDocsMap = new Map(existingDocs.map(d => [d.fileName, d]));

  const {
    toAdd: docsToAdd,
    toUpdate: docsToUpdate,
    unchanged: docsUnchanged,
  } = categorizeDocuments(fetchedDocs, existingDocsMap, contentHashCache);

  for (const doc of docsToUpdate) {
    const cacheKey = doc.sourceId || doc.fileName;
    logger.debug(
      `Document ${doc.fileName} content changed (hash: ${contentHashCache.get(cacheKey)} -> ${doc.contentHash})`,
    );
  }

  return {
    fetchedDocs,
    existingDocs,
    existingDocsMap,
    docsToAdd,
    docsToUpdate,
    docsUnchanged,
  };
}

export async function performSync(
  config: DocumentsConfig,
  ingestion: DocumentIngestionService,
  vectorStore: VectorStoreService,
  hashOps: HashCacheOps,
  loadHashCache: () => Promise<void>,
  logger: LoggerService,
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    logger.info(`Starting document sync (mode: ${config.syncMode})`);

    const {
      fetchedDocs,
      existingDocs,
      existingDocsMap,
      docsToAdd,
      docsToUpdate,
      docsUnchanged,
    } = await fetchAndCategorize(
      config,
      ingestion,
      vectorStore,
      hashOps.contentHashCache,
      loadHashCache,
      logger,
    );

    const fetchedByFileName = new Map(fetchedDocs.map(d => [d.fileName, d]));
    for (const fileName of docsUnchanged) {
      const doc = fetchedByFileName.get(fileName);
      if (doc?.contentHash) {
        const cacheKey = doc.sourceId || doc.fileName;
        if (!hashOps.contentHashCache.has(cacheKey)) {
          hashOps.evictCacheIfNeeded();
          hashOps.contentHashCache.set(cacheKey, doc.contentHash);
          await hashOps.persistHash(fileName, doc.contentHash, doc.sourceId);
        }
      }
    }

    let addedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    const uploadResult = await uploadNewDocuments(
      docsToAdd,
      vectorStore,
      hashOps,
      logger,
    );
    addedCount = uploadResult.addedCount;
    failedCount += uploadResult.failedCount;

    const updateResult = await updateChangedDocuments(
      docsToUpdate,
      existingDocsMap,
      vectorStore,
      hashOps,
      logger,
    );
    updatedCount = updateResult.updatedCount;
    failedCount += updateResult.failedCount;

    const removeResult = await removeDeletedDocuments(
      config,
      existingDocs,
      fetchedDocs,
      vectorStore,
      hashOps,
      logger,
    );
    failedCount += removeResult.failedCount;

    const duration = Date.now() - startTime;
    logger.info(
      `Document sync completed in ${duration}ms: added=${addedCount}, updated=${updatedCount}, removed=${removeResult.removedCount}, failed=${failedCount}, unchanged=${docsUnchanged.length}`,
    );

    const errors: string[] = [];
    if (failedCount > 0)
      errors.push(`${failedCount} document(s) failed to sync`);
    return {
      added: addedCount,
      updated: updatedCount,
      removed: removeResult.removedCount,
      failed: failedCount,
      unchanged: docsUnchanged.length,
      errors,
    };
  } catch (error) {
    logger.error(`Document sync failed: ${toErrorMessage(error)}`);
    throw error;
  }
}
