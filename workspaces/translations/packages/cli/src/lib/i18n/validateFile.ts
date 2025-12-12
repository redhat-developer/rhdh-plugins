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

import path from 'path';

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
 * Validate JSON translation file
 */
async function validateJsonFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check for invalid unicode sequences
    if (!isValidUTF8(content)) {
      throw new Error('File contains invalid UTF-8 sequences');
    }

    // Check for null bytes which are never valid in JSON strings
    if (content.includes('\x00')) {
      throw new Error(
        'File contains null bytes (\\x00) which are not valid in JSON',
      );
    }

    // Try to parse JSON - this will catch syntax errors
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

    // Check if it's a valid JSON object
    if (typeof data !== 'object' || data === null) {
      throw new Error('Root element must be a JSON object');
    }

    // Check if it's nested structure: { plugin: { en: { keys } } }
    const isNested = (
      obj: unknown,
    ): obj is Record<string, { en: Record<string, unknown> }> => {
      if (typeof obj !== 'object' || obj === null) return false;
      const firstKey = Object.keys(obj)[0];
      if (!firstKey) return false;
      const firstValue = (obj as Record<string, unknown>)[firstKey];
      return (
        typeof firstValue === 'object' &&
        firstValue !== null &&
        'en' in firstValue
      );
    };

    let totalKeys = 0;

    if (isNested(data)) {
      // Nested structure: { plugin: { en: { key: value } } }
      // Keys are flat dot-notation strings (e.g., "menuItem.home": "Home")
      for (const [pluginName, pluginData] of Object.entries(data)) {
        if (typeof pluginData !== 'object' || pluginData === null) {
          throw new Error(`Plugin "${pluginName}" must be an object`);
        }

        if (!('en' in pluginData)) {
          throw new Error(`Plugin "${pluginName}" must have an "en" property`);
        }

        const enData = pluginData.en;
        if (typeof enData !== 'object' || enData === null) {
          throw new Error(`Plugin "${pluginName}".en must be an object`);
        }

        // Validate that all values are strings (keys are flat dot-notation)
        for (const [key, value] of Object.entries(enData)) {
          if (typeof value !== 'string') {
            throw new Error(
              `Translation value for "${pluginName}.en.${key}" must be a string, got ${typeof value}`,
            );
          }

          // Check for null bytes
          if (value.includes('\x00')) {
            throw new Error(
              `Translation value for "${pluginName}.en.${key}" contains null byte`,
            );
          }

          // Check for Unicode curly quotes/apostrophes
          const curlyApostrophe = /['']/;
          const curlyQuotes = /[""]/;
          if (curlyApostrophe.test(value) || curlyQuotes.test(value)) {
            console.warn(
              `Warning: Translation value for "${pluginName}.en.${key}" contains Unicode curly quotes/apostrophes.`,
            );
            console.warn(
              `  Consider normalizing to standard quotes: ' → ' and " → "`,
            );
          }

          totalKeys++;
        }
      }
    } else {
      // Legacy structure: { translations: { key: value } } or flat { key: value }
      const translations = data.translations || data;

      if (typeof translations !== 'object' || translations === null) {
        throw new Error('Translations must be an object');
      }

      // Validate that all values are strings
      for (const [key, value] of Object.entries(translations)) {
        if (typeof value !== 'string') {
          throw new Error(
            `Translation value for key "${key}" must be a string, got ${typeof value}`,
          );
        }

        // Check for null bytes
        if (value.includes('\x00')) {
          throw new Error(
            `Translation value for key "${key}" contains null byte`,
          );
        }

        // Check for Unicode curly quotes/apostrophes
        const curlyApostrophe = /['']/;
        const curlyQuotes = /[""]/;
        if (curlyApostrophe.test(value) || curlyQuotes.test(value)) {
          console.warn(
            `Warning: Translation value for key "${key}" contains Unicode curly quotes/apostrophes.`,
          );
          console.warn(
            `  Consider normalizing to standard quotes: ' → ' and " → "`,
          );
        }

        totalKeys++;
      }
    }

    // Verify the file can be re-stringified (round-trip test)
    const reStringified = JSON.stringify(data, null, 2);
    const reparsed = JSON.parse(reStringified);

    // Compare key counts to ensure nothing was lost
    let reparsedKeys = 0;
    if (isNested(reparsed)) {
      for (const pluginData of Object.values(reparsed)) {
        if (pluginData.en && typeof pluginData.en === 'object') {
          reparsedKeys += Object.keys(pluginData.en).length;
        }
      }
    } else {
      const reparsedTranslations = reparsed.translations || reparsed;
      reparsedKeys = Object.keys(reparsedTranslations).length;
    }

    if (totalKeys !== reparsedKeys) {
      throw new Error(
        `Key count mismatch: original has ${totalKeys} keys, reparsed has ${reparsedKeys} keys`,
      );
    }

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
