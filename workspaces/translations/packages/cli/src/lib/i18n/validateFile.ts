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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate translation file format and content
 */
export async function validateTranslationFile(
  filePath: string,
): Promise<boolean> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        return await validateJsonFile(filePath);
      case '.po':
        return await validatePoFile(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  } catch (error) {
    console.error(`Validation error for ${filePath}:`, error);
    return false;
  }
}

/**
 * Validate file content (UTF-8 and null bytes)
 */
function validateFileContent(content: string): void {
  if (!isValidUTF8(content)) {
    throw new Error('File contains invalid UTF-8 sequences');
  }

  if (content.includes('\x00')) {
    throw new Error(
      String.raw`File contains null bytes (\x00) which are not valid in JSON`,
    );
  }
}

/**
 * Parse JSON content and validate it's an object
 */
function parseJsonContent(content: string): Record<string, unknown> {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(content) as Record<string, unknown>;
  } catch (parseError) {
    throw new Error(
      `JSON parse error: ${
        parseError instanceof Error ? parseError.message : 'Unknown error'
      }`,
    );
  }

  if (typeof data !== 'object' || data === null) {
    throw new TypeError('Root element must be a JSON object');
  }

  return data;
}

/**
 * Type guard to check if object is nested structure
 */
function isNestedStructure(
  obj: unknown,
): obj is Record<string, { en: Record<string, unknown> }> {
  if (typeof obj !== 'object' || obj === null) return false;
  const firstKey = Object.keys(obj)[0];
  if (!firstKey) return false;
  const firstValue = (obj as Record<string, unknown>)[firstKey];
  return (
    typeof firstValue === 'object' && firstValue !== null && 'en' in firstValue
  );
}

/**
 * Validate a single translation value
 */
function validateTranslationValue(value: unknown, keyPath: string): void {
  if (typeof value !== 'string') {
    throw new TypeError(
      `Translation value for "${keyPath}" must be a string, got ${typeof value}`,
    );
  }

  if (value.includes('\x00')) {
    throw new Error(`Translation value for "${keyPath}" contains null byte`);
  }

  const curlyApostrophe = /[\u2018\u2019]/;
  const curlyQuotes = /[\u201C\u201D]/;
  if (curlyApostrophe.test(value) || curlyQuotes.test(value)) {
    console.warn(
      `Warning: Translation value for "${keyPath}" contains Unicode curly quotes/apostrophes.`,
    );
    console.warn(`  Consider normalizing to standard quotes: ' → ' and " → "`);
  }
}

/**
 * Validate nested structure and count keys
 */
function validateNestedStructure(
  data: Record<string, { en: Record<string, unknown> }>,
): number {
  let totalKeys = 0;

  for (const [pluginName, pluginData] of Object.entries(data)) {
    if (typeof pluginData !== 'object' || pluginData === null) {
      throw new TypeError(`Plugin "${pluginName}" must be an object`);
    }

    if (!('en' in pluginData)) {
      throw new Error(`Plugin "${pluginName}" must have an "en" property`);
    }

    const enData = pluginData.en;
    if (typeof enData !== 'object' || enData === null) {
      throw new TypeError(`Plugin "${pluginName}".en must be an object`);
    }

    for (const [key, value] of Object.entries(enData)) {
      validateTranslationValue(value, `${pluginName}.en.${key}`);
      totalKeys++;
    }
  }

  return totalKeys;
}

/**
 * Validate flat structure and count keys
 */
function validateFlatStructure(data: Record<string, unknown>): number {
  const translations = data.translations || data;

  if (typeof translations !== 'object' || translations === null) {
    throw new TypeError('Translations must be an object');
  }

  let totalKeys = 0;
  for (const [key, value] of Object.entries(translations)) {
    validateTranslationValue(value, key);
    totalKeys++;
  }

  return totalKeys;
}

/**
 * Count keys in nested structure
 */
function countNestedKeys(
  data: Record<string, { en: Record<string, unknown> }>,
): number {
  let count = 0;
  for (const pluginData of Object.values(data)) {
    if (pluginData.en && typeof pluginData.en === 'object') {
      count += Object.keys(pluginData.en).length;
    }
  }
  return count;
}

/**
 * Count keys in flat structure
 */
function countFlatKeys(data: Record<string, unknown>): number {
  const translations = data.translations || data;
  return Object.keys(translations).length;
}

/**
 * Validate round-trip JSON parsing
 */
function validateRoundTrip(
  data: Record<string, unknown>,
  originalKeyCount: number,
): void {
  const reStringified = JSON.stringify(data, null, 2);
  const reparsed = JSON.parse(reStringified) as Record<string, unknown>;

  const reparsedKeys = isNestedStructure(reparsed)
    ? countNestedKeys(reparsed)
    : countFlatKeys(reparsed);

  if (originalKeyCount !== reparsedKeys) {
    throw new Error(
      `Key count mismatch: original has ${originalKeyCount} keys, reparsed has ${reparsedKeys} keys`,
    );
  }
}

/**
 * Validate JSON translation file
 */
async function validateJsonFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    validateFileContent(content);

    const data = parseJsonContent(content);
    const totalKeys = isNestedStructure(data)
      ? validateNestedStructure(data)
      : validateFlatStructure(data);

    validateRoundTrip(data, totalKeys);

    return true;
  } catch (error) {
    console.error(
      `JSON validation error for ${filePath}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Check if string is valid UTF-8
 */
function isValidUTF8(str: string): boolean {
  try {
    // Try to encode and decode - if it fails, it's invalid UTF-8
    const encoded = Buffer.from(str, 'utf-8');
    const decoded = encoded.toString('utf-8');
    return decoded === str;
  } catch {
    return false;
  }
}

/**
 * Validate PO translation file
 */
async function validatePoFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    let hasMsgId = false;
    let hasMsgStr = false;
    let inEntry = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('msgid ')) {
        hasMsgId = true;
        inEntry = true;
      } else if (trimmed.startsWith('msgstr ')) {
        hasMsgStr = true;
      } else if (trimmed === '' && inEntry) {
        // End of entry
        if (!hasMsgId || !hasMsgStr) {
          return false;
        }
        hasMsgId = false;
        hasMsgStr = false;
        inEntry = false;
      }
    }

    // Check final entry if file doesn't end with empty line
    if (inEntry && (!hasMsgId || !hasMsgStr)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
