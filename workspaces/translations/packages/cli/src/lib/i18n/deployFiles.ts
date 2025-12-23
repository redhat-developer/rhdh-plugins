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
 * Deploy translation files to application language files
 */
export async function deployTranslationFiles(
  data: TranslationData,
  targetPath: string,
  format: string,
): Promise<void> {
  const outputDir = path.dirname(targetPath);
  await fs.ensureDir(outputDir);

  switch (format.toLowerCase()) {
    case 'json':
      await deployJsonFile(data, targetPath);
      break;
    case 'po':
      await deployPoFile(data, targetPath);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Deploy JSON translation file
 */
async function deployJsonFile(
  data: TranslationData,
  targetPath: string,
): Promise<void> {
  // For JSON files, we can deploy directly as they are commonly used in applications
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      version: '1.0',
      totalKeys: Object.keys(data).length,
    },
    translations: data,
  };

  await fs.writeJson(targetPath, output, { spaces: 2 });
}

/**
 * Deploy PO translation file
 */
async function deployPoFile(
  data: TranslationData,
  targetPath: string,
): Promise<void> {
  const lines: string[] = [];

  // PO file header
  lines.push('msgid ""');
  lines.push('msgstr ""');
  lines.push(String.raw`"Content-Type: text/plain; charset=UTF-8\n"`);
  lines.push(String.raw`"Generated: ${new Date().toISOString()}\n"`);
  lines.push(String.raw`"Total-Keys: ${Object.keys(data).length}\n"`);
  lines.push('');

  // Translation entries
  for (const [key, value] of Object.entries(data)) {
    lines.push(`msgid "${escapePoString(key)}"`);
    lines.push(`msgstr "${escapePoString(value)}"`);
    lines.push('');
  }

  await fs.writeFile(targetPath, lines.join('\n'), 'utf-8');
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
