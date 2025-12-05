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
 * Save translation file in various formats
 */
export async function saveTranslationFile(
  data: TranslationData,
  filePath: string,
  format: string,
): Promise<void> {
  const outputDir = path.dirname(filePath);
  await fs.ensureDir(outputDir);

  switch (format.toLowerCase()) {
    case 'json':
      await saveJsonFile(data, filePath);
      break;
    case 'po':
      await savePoFile(data, filePath);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Save JSON translation file
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
