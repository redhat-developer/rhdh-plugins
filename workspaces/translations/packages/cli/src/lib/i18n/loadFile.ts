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

export interface TranslationData {
  [key: string]: string;
}

/**
 * Load translation file in various formats
 */
export async function loadTranslationFile(
  filePath: string,
  format: string,
): Promise<TranslationData> {
  const ext = path.extname(filePath).toLowerCase();
  const actualFormat = ext.substring(1); // Remove the dot

  if (actualFormat !== format.toLowerCase()) {
    throw new Error(
      `File format mismatch: expected ${format}, got ${actualFormat}`,
    );
  }

  switch (format.toLowerCase()) {
    case 'json':
      return await loadJsonFile(filePath);
    case 'po':
      return await loadPoFile(filePath);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Load JSON translation file
 */
async function loadJsonFile(filePath: string): Promise<TranslationData> {
  try {
    const data = await fs.readJson(filePath);

    // Handle different JSON structures
    if (data.translations && typeof data.translations === 'object') {
      return data.translations;
    }

    if (typeof data === 'object' && data !== null) {
      return data;
    }

    return {};
  } catch (error) {
    throw new Error(`Failed to load JSON file ${filePath}: ${error}`);
  }
}

/**
 * Load PO translation file
 */
async function loadPoFile(filePath: string): Promise<TranslationData> {
  try {
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
        // Save previous entry if exists
        if (currentKey && currentValue) {
          data[currentKey] = currentValue;
        }

        currentKey = unescapePoString(
          trimmed.substring(6).replace(/(^["']|["']$)/g, ''),
        );
        currentValue = '';
        inMsgId = true;
        inMsgStr = false;
      } else if (trimmed.startsWith('msgstr ')) {
        currentValue = unescapePoString(
          trimmed.substring(7).replace(/(^["']|["']$)/g, ''),
        );
        inMsgId = false;
        inMsgStr = true;
      } else if (trimmed.startsWith('"') && (inMsgId || inMsgStr)) {
        const value = unescapePoString(trimmed.replace(/(^["']|["']$)/g, ''));
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
  } catch (error) {
    throw new Error(`Failed to load PO file ${filePath}: ${error}`);
  }
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
