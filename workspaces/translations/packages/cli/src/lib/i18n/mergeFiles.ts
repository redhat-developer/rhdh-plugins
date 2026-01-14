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

import fs from 'fs-extra';

import { escapePoString } from '../utils/translationUtils';
import { loadPoFile } from './loadFile';

export interface TranslationData {
  [key: string]: string;
}

/**
 * Nested translation structure: { plugin: { en: { key: value } } }
 */
export interface NestedTranslationData {
  [pluginName: string]: {
    en: Record<string, string>;
  };
}

/**
 * Check if data is in nested structure
 */
function isNestedStructure(data: unknown): data is NestedTranslationData {
  if (typeof data !== 'object' || data === null) return false;
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return false;
  const firstValue = (data as Record<string, unknown>)[firstKey];
  return (
    typeof firstValue === 'object' && firstValue !== null && 'en' in firstValue
  );
}

/**
 * Load existing translation file
 */
async function loadExistingFile(
  existingPath: string,
  format: string,
): Promise<unknown> {
  try {
    switch (format.toLowerCase()) {
      case 'json':
        return await loadJsonFile(existingPath);
      case 'po':
        return await loadPoFile(existingPath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.warn(
      `Warning: Could not load existing file ${existingPath}: ${error}`,
    );
    return {};
  }
}

/**
 * Merge nested structures
 */
function mergeNestedStructures(
  newKeys: NestedTranslationData,
  existingData: unknown,
): NestedTranslationData {
  if (!isNestedStructure(existingData)) {
    // Existing is flat, new is nested - use new nested structure
    return newKeys;
  }

  // Both are nested - merge plugin by plugin
  const mergedData = { ...existingData };
  for (const [pluginName, pluginData] of Object.entries(newKeys)) {
    if (mergedData[pluginName]) {
      // Merge keys within the plugin
      mergedData[pluginName] = {
        en: { ...mergedData[pluginName].en, ...pluginData.en },
      };
    } else {
      // New plugin
      mergedData[pluginName] = pluginData;
    }
  }

  return mergedData;
}

/**
 * Merge flat structures
 */
function mergeFlatStructures(
  newKeys: TranslationData,
  existingData: unknown,
): TranslationData {
  const existingFlat = isNestedStructure(existingData)
    ? {} // Can't merge flat with nested - use new keys only
    : (existingData as TranslationData);

  return { ...existingFlat, ...newKeys };
}

/**
 * Save merged flat data
 */
async function saveMergedFlatData(
  mergedData: TranslationData,
  existingPath: string,
  format: string,
): Promise<void> {
  switch (format.toLowerCase()) {
    case 'json':
      await saveJsonFile(mergedData, existingPath);
      break;
    case 'po':
      await savePoFile(mergedData, existingPath);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Merge translation keys with existing translation file
 * Supports both flat and nested structures
 */
export async function mergeTranslationFiles(
  newKeys: Record<string, string> | NestedTranslationData,
  existingPath: string,
  format: string,
): Promise<void> {
  if (!(await fs.pathExists(existingPath))) {
    throw new Error(`Existing file not found: ${existingPath}`);
  }

  const existingData = await loadExistingFile(existingPath, format);

  if (isNestedStructure(newKeys)) {
    const mergedData = mergeNestedStructures(newKeys, existingData);
    await saveNestedJsonFile(mergedData, existingPath);
  } else {
    const mergedData = mergeFlatStructures(newKeys, existingData);
    await saveMergedFlatData(mergedData, existingPath, format);
  }
}

/**
 * Load JSON translation file (returns either flat or nested structure)
 */
async function loadJsonFile(
  filePath: string,
): Promise<TranslationData | NestedTranslationData> {
  const data = await fs.readJson(filePath);

  // Check if it's nested structure
  if (isNestedStructure(data)) {
    return data;
  }

  // Check if it has translations wrapper (legacy flat structure)
  if (data.translations && typeof data.translations === 'object') {
    return data.translations as TranslationData;
  }

  // Assume flat structure
  if (typeof data === 'object' && data !== null) {
    return data as TranslationData;
  }

  return {};
}

/**
 * Save JSON translation file (flat structure with metadata)
 */
async function saveJsonFile(
  data: TranslationData,
  filePath: string,
): Promise<void> {
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      version: '1.0',
      totalKeys: Object.keys(data).length,
    },
    translations: data,
  };

  await fs.writeJson(filePath, output, { spaces: 2 });
}

/**
 * Save nested JSON translation file (no metadata wrapper)
 */
async function saveNestedJsonFile(
  data: NestedTranslationData,
  filePath: string,
): Promise<void> {
  await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Save PO translation file
 */
async function savePoFile(
  data: TranslationData,
  filePath: string,
): Promise<void> {
  // PO file header
  const headerLines = [
    'msgid ""',
    'msgstr ""',
    String.raw`"Content-Type: text/plain; charset=UTF-8\n"`,
    String.raw`"Generated: ${new Date().toISOString()}\n"`,
    String.raw`"Total-Keys: ${Object.keys(data).length}\n"`,
    '',
  ];

  // Translation entries
  const translationLines = Object.entries(data).flatMap(([key, value]) => [
    `msgid "${escapePoString(key)}"`,
    `msgstr "${escapePoString(value)}"`,
    '',
  ]);

  const lines = [...headerLines, ...translationLines];
  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
}
