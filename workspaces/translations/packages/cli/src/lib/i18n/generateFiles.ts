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

import path from 'node:path';

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
 * Generate translation files in various formats
 * Accepts either flat structure (Record<string, string>) or nested structure (NestedTranslationData)
 */
export async function generateTranslationFiles(
  keys: Record<string, string> | NestedTranslationData,
  outputPath: string,
  format: string,
): Promise<void> {
  const outputDir = path.dirname(outputPath);
  await fs.ensureDir(outputDir);

  switch (format.toLowerCase()) {
    case 'json':
      await generateJsonFile(keys, outputPath);
      break;
    case 'po':
      await generatePoFile(keys, outputPath);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Check if data is in nested structure
 */
function isNestedStructure(
  data: Record<string, string> | NestedTranslationData,
): data is NestedTranslationData {
  // Empty object should be treated as nested structure (matches reference.json format)
  const keys = Object.keys(data);
  if (keys.length === 0) return true;

  // Check if it's nested: { plugin: { en: { ... } } }
  const firstKey = keys[0];
  const firstValue = data[firstKey];
  return (
    typeof firstValue === 'object' && firstValue !== null && 'en' in firstValue
  );
}

/**
 * Generate JSON translation file
 */
async function generateJsonFile(
  keys: Record<string, string> | NestedTranslationData,
  outputPath: string,
): Promise<void> {
  // Normalize Unicode curly quotes/apostrophes to standard ASCII equivalents
  // This ensures compatibility with TMS systems that might not handle Unicode quotes well
  const normalizeValue = (value: string): string => {
    return value
      .replaceAll(/'/g, "'") // U+2018 LEFT SINGLE QUOTATION MARK → U+0027 APOSTROPHE
      .replaceAll(/'/g, "'") // U+2019 RIGHT SINGLE QUOTATION MARK → U+0027 APOSTROPHE
      .replaceAll(/"/g, '"') // U+201C LEFT DOUBLE QUOTATION MARK → U+0022 QUOTATION MARK
      .replaceAll(/"/g, '"'); // U+201D RIGHT DOUBLE QUOTATION MARK → U+0022 QUOTATION MARK
  };

  if (isNestedStructure(keys)) {
    // New nested structure: { plugin: { en: { key: value } } }
    // Keep keys as flat dot-notation strings (e.g., "menuItem.home": "Home")
    const normalizedData: NestedTranslationData = {};

    for (const [pluginName, pluginData] of Object.entries(keys)) {
      normalizedData[pluginName] = {
        en: {},
      };

      for (const [key, value] of Object.entries(pluginData.en)) {
        normalizedData[pluginName].en[key] = normalizeValue(value);
      }
    }

    // Write nested structure directly (no metadata wrapper)
    await fs.writeJson(outputPath, normalizedData, { spaces: 2 });
  } else {
    // Legacy flat structure: { key: value }
    const normalizedKeys: Record<string, string> = {};
    for (const [key, value] of Object.entries(keys)) {
      normalizedKeys[key] = normalizeValue(value);
    }

    const data = {
      metadata: {
        generated: new Date().toISOString(),
        version: '1.0',
        totalKeys: Object.keys(normalizedKeys).length,
      },
      translations: normalizedKeys,
    };

    await fs.writeJson(outputPath, data, { spaces: 2 });
  }
}

/**
 * Generate PO (Portable Object) translation file
 */
async function generatePoFile(
  keys: Record<string, string> | NestedTranslationData,
  outputPath: string,
): Promise<void> {
  const lines: string[] = [];

  // Flatten nested structure if needed
  let flatKeys: Record<string, string>;
  if (isNestedStructure(keys)) {
    flatKeys = {};
    for (const [pluginName, pluginData] of Object.entries(keys)) {
      for (const [key, value] of Object.entries(pluginData.en)) {
        // Use plugin.key format for PO files to maintain structure
        flatKeys[`${pluginName}.${key}`] = value;
      }
    }
  } else {
    flatKeys = keys;
  }

  // PO file header
  lines.push('msgid ""');
  lines.push('msgstr ""');
  lines.push(String.raw`"Content-Type: text/plain; charset=UTF-8\n"`);
  lines.push(String.raw`"Generated: ${new Date().toISOString()}\n"`);
  lines.push(String.raw`"Total-Keys: ${Object.keys(flatKeys).length}\n"`);
  lines.push('');

  // Translation entries
  for (const [key, value] of Object.entries(flatKeys)) {
    lines.push(`msgid "${escapePoString(key)}"`);
    lines.push(`msgstr "${escapePoString(value)}"`);
    lines.push('');
  }

  await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
}

/**
 * Escape string for PO format
 */
function escapePoString(str: string): string {
  return str
    .replaceAll(/\\/g, '\\\\')
    .replaceAll(/"/g, '\\"')
    .replaceAll(/\n/g, '\\n')
    .replaceAll(/\r/g, '\\r')
    .replaceAll(/\t/g, '\\t');
}
