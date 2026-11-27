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

import { extractText } from 'unpdf';

const PLAINTEXT_EXTENSIONS = new Set(['.json', '.yaml', '.yml', '.log']);
const TEXT_EXTENSIONS = new Set(['.txt', '.md']);

/**
 * Normalize line endings, trim, and collapse runs of blank lines.
 * Matches the output previously produced by markitdown-ts.
 */
const normalizeText = (text: string): string =>
  text
    .replace(/\r\n|\r/g, '\n')
    .trim()
    .replace(/\n{3,}/g, '\n\n');

async function extractPdfText(
  buffer: Buffer,
  originalName: string,
): Promise<string> {
  try {
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return text;
  } catch (error) {
    throw new InputError(`Failed to extract text from ${originalName}`, error);
  }
}

/**
 * Convert an uploaded document buffer to text for the vector store.
 * Plain-text formats (json, yaml, log) are passed through as-is,
 * txt and md are normalized, and pdf text is extracted with unpdf.
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

  let text: string;
  if (ext === '.pdf') {
    text = await extractPdfText(buffer, originalName);
  } else if (TEXT_EXTENSIONS.has(ext)) {
    text = buffer.toString('utf-8');
  } else {
    throw new InputError(`Unsupported file type "${fileType}"`);
  }

  const markdown = normalizeText(text);
  if (!markdown) {
    throw new InputError(
      `Markdown conversion produced no output for ${originalName}`,
    );
  }

  return markdown;
}
