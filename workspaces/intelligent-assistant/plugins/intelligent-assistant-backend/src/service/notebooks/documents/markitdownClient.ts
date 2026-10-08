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

import { InputError } from '@backstage/errors';

import { MarkItDown } from 'markitdown-ts';

const markitdown = new MarkItDown();

const PLAINTEXT_EXTENSIONS = new Set(['.json', '.yaml', '.yml', '.log']);

/**
 * Convert a document buffer to markdown using markitdown-ts.
 * Plain-text formats (json, yaml, log) are passed through as-is.
 */
export async function convertToMarkdown(
  buffer: Buffer,
  originalName: string,
  fileType: string,
): Promise<string> {
  const normalizedFileType = fileType.toLowerCase();
  const ext = `.${normalizedFileType}`;

  const nameExt = originalName.includes('.')
    ? `.${originalName.split('.').pop()!.toLowerCase()}`
    : '';
  // Treat .yml and .yaml as equivalent
  const normalizeExt = (e: string) => (e === '.yml' ? '.yaml' : e);
  if (nameExt && normalizeExt(nameExt) !== normalizeExt(ext)) {
    throw new InputError(
      `File extension "${nameExt}" does not match declared file type "${fileType}"`,
    );
  }

  if (PLAINTEXT_EXTENSIONS.has(ext)) {
    return buffer.toString('utf-8');
  }

  const result = await markitdown.convertBuffer(buffer, {
    file_extension: ext,
  });

  if (!result?.markdown) {
    throw new InputError(
      `Markdown conversion produced no output for ${originalName}`,
    );
  }

  return result.markdown;
}
