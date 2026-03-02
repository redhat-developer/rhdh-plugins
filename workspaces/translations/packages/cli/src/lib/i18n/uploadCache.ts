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

import { createHash } from 'node:crypto';
import path from 'node:path';

import fs from 'fs-extra';

export interface UploadCacheEntry {
  filePath: string;
  fileHash: string;
  projectId: string;
  tmsUrl: string;
  uploadedAt: string;
  keyCount: number;
  uploadFileName?: string; // Track the actual filename uploaded to Memsource
}

/**
 * Get cache directory path
 */
function getCacheDir(): string {
  return path.join(process.cwd(), '.i18n-cache');
}

/**
 * Get cache file path for a project
 */
function getCacheFilePath(projectId: string, tmsUrl: string): string {
  const cacheDir = getCacheDir();
  // Create a safe filename from projectId and URL
  const safeProjectId = projectId.replaceAll(/[^a-zA-Z0-9]/g, '_');
  // Use SHA-256 instead of MD5 for better security (even in non-sensitive contexts)
  // Truncate to 8 chars for filename compatibility
  const urlHash = createHash('sha256')
    .update(tmsUrl)
    .digest('hex')
    .substring(0, 8);
  return path.join(cacheDir, `upload_${safeProjectId}_${urlHash}.json`);
}

/**
 * Calculate file hash (SHA-256)
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  // Normalize content (remove metadata that changes on each generation)
  const data = JSON.parse(content);
  // Remove metadata that changes on each generation
  if (data.metadata) {
    delete data.metadata.generated;
  }
  const normalizedContent = JSON.stringify(data, null, 2);

  return createHash('sha256').update(normalizedContent).digest('hex');
}

/**
 * Get cached upload entry for a file
 */
export async function getCachedUpload(
  filePath: string,
  projectId: string,
  tmsUrl: string,
): Promise<UploadCacheEntry | null> {
  try {
    const cacheFilePath = getCacheFilePath(projectId, tmsUrl);

    if (!(await fs.pathExists(cacheFilePath))) {
      return null;
    }

    const cacheData = await fs.readJson(cacheFilePath);
    const entry: UploadCacheEntry = cacheData;

    // Verify the entry is for the same file path
    if (entry.filePath !== filePath) {
      return null;
    }

    return entry;
  } catch {
    // If cache file is corrupted, return null (will re-upload)
    return null;
  }
}

/**
 * Check if file has changed since last upload
 */
export async function hasFileChanged(
  filePath: string,
  projectId: string,
  tmsUrl: string,
): Promise<boolean> {
  const cachedEntry = await getCachedUpload(filePath, projectId, tmsUrl);

  if (!cachedEntry) {
    return true; // No cache, consider it changed
  }

  // Check if file still exists
  if (!(await fs.pathExists(filePath))) {
    return true;
  }

  // Calculate current file hash
  const currentHash = await calculateFileHash(filePath);

  // Compare with cached hash
  return currentHash !== cachedEntry.fileHash;
}

/**
 * Save upload cache entry
 */
export async function saveUploadCache(
  filePath: string,
  projectId: string,
  tmsUrl: string,
  keyCount: number,
  uploadFileName?: string,
): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    await fs.ensureDir(cacheDir);

    const fileHash = await calculateFileHash(filePath);
    const cacheEntry: UploadCacheEntry = {
      filePath,
      fileHash,
      projectId,
      tmsUrl,
      uploadedAt: new Date().toISOString(),
      keyCount,
      uploadFileName, // Store the upload filename to track what was actually uploaded
    };

    const cacheFilePath = getCacheFilePath(projectId, tmsUrl);
    await fs.writeJson(cacheFilePath, cacheEntry, { spaces: 2 });
  } catch (error) {
    // Don't fail upload if cache save fails
    console.warn(`Warning: Failed to save upload cache: ${error}`);
  }
}

/**
 * Clear upload cache for a project
 */
export async function clearUploadCache(
  projectId: string,
  tmsUrl: string,
): Promise<void> {
  try {
    const cacheFilePath = getCacheFilePath(projectId, tmsUrl);
    if (await fs.pathExists(cacheFilePath)) {
      await fs.remove(cacheFilePath);
    }
  } catch {
    // Ignore errors when clearing cache
  }
}

/**
 * Clear all upload caches
 */
export async function clearAllUploadCaches(): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    if (await fs.pathExists(cacheDir)) {
      const files = await fs.readdir(cacheDir);
      for (const file of files) {
        if (file.startsWith('upload_') && file.endsWith('.json')) {
          await fs.remove(path.join(cacheDir, file));
        }
      }
    }
  } catch {
    // Ignore errors when clearing cache
  }
}
