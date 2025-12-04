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

  let existingData: unknown = {};

  try {
    switch (format.toLowerCase()) {
      case 'json':
        existingData = await loadJsonFile(existingPath);
        break;
      case 'po':
        existingData = await loadPoFile(existingPath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.warn(
      `Warning: Could not load existing file ${existingPath}: ${error}`,
    );
    existingData = {};
  }

  // Handle merging based on structure
  if (isNestedStructure(newKeys)) {
    // New keys are in nested structure
    let mergedData: NestedTranslationData;

    if (isNestedStructure(existingData)) {
      // Both are nested - merge plugin by plugin
      mergedData = { ...existingData };
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
    } else {
      // Existing is flat, new is nested - convert existing to nested and merge
      // This is a migration scenario - we'll use the new nested structure
      mergedData = newKeys;
    }

    // Save merged nested data
    await saveNestedJsonFile(mergedData, existingPath);
  } else {
    // New keys are flat (legacy)
    const existingFlat = isNestedStructure(existingData)
      ? {} // Can't merge flat with nested - use new keys only
      : (existingData as TranslationData);

    const mergedData = { ...existingFlat, ...newKeys };

    // Save merged flat data
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
 * Load PO translation file
 */
async function loadPoFile(filePath: string): Promise<TranslationData> {
  const content = await fs.readFile(filePath, 'utf-8');
  const data: TranslationData = {};

  const lines = content.split('\n');
  let currentKey = '';
  let currentValue = '';
  let inMsgId = false;
  let inMsgStr = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('msgid ')) {
      if (currentKey && currentValue) {
        data[currentKey] = currentValue;
      }
      currentKey = unescapePoString(
        trimmed.substring(6).replace(/^["']|["']$/g, ''),
      );
      currentValue = '';
      inMsgId = true;
      inMsgStr = false;
    } else if (trimmed.startsWith('msgstr ')) {
      currentValue = unescapePoString(
        trimmed.substring(7).replace(/^["']|["']$/g, ''),
      );
      inMsgId = false;
      inMsgStr = true;
    } else if (trimmed.startsWith('"') && (inMsgId || inMsgStr)) {
      const value = unescapePoString(trimmed.replace(/^["']|["']$/g, ''));
      if (inMsgId) {
        currentKey += value;
      } else if (inMsgStr) {
        currentValue += value;
      }
    }
  }

  // Add the last entry
  if (currentKey && currentValue) {
    data[currentKey] = currentValue;
  }

  return data;
}

/**
 * Save PO translation file
 */
async function savePoFile(
  data: TranslationData,
  filePath: string,
): Promise<void> {
  const lines: string[] = [];

  // PO file header
  lines.push('msgid ""');
  lines.push('msgstr ""');
  lines.push('"Content-Type: text/plain; charset=UTF-8\\n"');
  lines.push(`"Generated: ${new Date().toISOString()}\\n"`);
  lines.push(`"Total-Keys: ${Object.keys(data).length}\\n"`);
  lines.push('');

  // Translation entries
  for (const [key, value] of Object.entries(data)) {
    lines.push(`msgid "${escapePoString(key)}"`);
    lines.push(`msgstr "${escapePoString(value)}"`);
    lines.push('');
  }

  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Escape string for PO format
 */
function escapePoString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Unescape string from PO format
 */
function unescapePoString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}
