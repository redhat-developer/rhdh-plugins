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

import { unescapePoString } from '../utils/translationUtils';

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
 * Extract and unescape PO string value
 */
function extractPoString(line: string, prefixLength: number): string {
  return unescapePoString(
    line.substring(prefixLength).replaceAll(/(^["']|["']$)/g, ''),
  );
}

/**
 * Extract and unescape PO string from continuation line
 */
function extractPoContinuation(line: string): string {
  return unescapePoString(line.replaceAll(/(^["']|["']$)/g, ''));
}

/**
 * Process msgid line
 */
function processMsgIdLine(
  line: string,
  currentKey: string,
  currentValue: string,
  data: TranslationData,
): { key: string; value: string; inMsgId: boolean; inMsgStr: boolean } {
  // Save previous entry if exists
  if (currentKey && currentValue) {
    data[currentKey] = currentValue;
  }

  return {
    key: extractPoString(line, 6),
    value: '',
    inMsgId: true,
    inMsgStr: false,
  };
}

/**
 * Process msgstr line
 */
function processMsgStrLine(line: string): {
  value: string;
  inMsgId: boolean;
  inMsgStr: boolean;
} {
  return {
    value: extractPoString(line, 7),
    inMsgId: false,
    inMsgStr: true,
  };
}

/**
 * Process continuation line
 */
function processContinuationLine(
  line: string,
  currentKey: string,
  currentValue: string,
  inMsgId: boolean,
  inMsgStr: boolean,
): { key: string; value: string } {
  const value = extractPoContinuation(line);
  return {
    key: inMsgId ? currentKey + value : currentKey,
    value: inMsgStr ? currentValue + value : currentValue,
  };
}

/**
 * Load PO translation file
 */
export async function loadPoFile(filePath: string): Promise<TranslationData> {
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
        const result = processMsgIdLine(
          trimmed,
          currentKey,
          currentValue,
          data,
        );
        currentKey = result.key;
        currentValue = result.value;
        inMsgId = result.inMsgId;
        inMsgStr = result.inMsgStr;
      } else if (trimmed.startsWith('msgstr ')) {
        const result = processMsgStrLine(trimmed);
        currentValue = result.value;
        inMsgId = result.inMsgId;
        inMsgStr = result.inMsgStr;
      } else if (trimmed.startsWith('"') && (inMsgId || inMsgStr)) {
        const result = processContinuationLine(
          trimmed,
          currentKey,
          currentValue,
          inMsgId,
          inMsgStr,
        );
        currentKey = result.key;
        currentValue = result.value;
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
