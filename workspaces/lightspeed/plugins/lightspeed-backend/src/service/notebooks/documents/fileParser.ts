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

import * as yaml from 'js-yaml';
import * as pdfjsLib from 'pdfjs-dist';

import { Readable } from 'stream';

import { SupportedFileType } from '../../constant';

export interface ParsedDocument {
  content: string;
  metadata: {
    fileName: string;
    fileType: string;
    pageCount?: number;
    url?: string;
    parseTimestamp: string;
  };
}

/**
 * Parse text-based files (md, txt, log)
 */
function parseTextFile(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): ParsedDocument {
  const content = buffer.toString('utf-8');

  return {
    content,
    metadata: {
      fileName,
      fileType,
      parseTimestamp: new Date().toISOString(),
    },
  };
}

/**
 * Parse JSON files
 */
function parseJSONFile(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): ParsedDocument {
  try {
    const content = buffer.toString('utf-8');
    // Validate JSON but keep original formatting
    JSON.parse(content);

    return {
      content,
      metadata: {
        fileName,
        fileType,
        parseTimestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new InputError(`Invalid JSON file: ${error}`);
  }
}

/**
 * Parse YAML files
 */
function parseYAMLFile(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): ParsedDocument {
  try {
    const content = buffer.toString('utf-8');
    // Validate YAML but keep original formatting and comments
    yaml.load(content);

    return {
      content,
      metadata: {
        fileName,
        fileType,
        parseTimestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new InputError(`Invalid YAML file: ${error}`);
  }
}

/**
 * Parse PDF files
 * Extracts text content from PDF using PDF.js
 */
async function parsePDFFile(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<ParsedDocument> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const textParts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .filter((str: string) => str.trim().length > 0)
        .join(' ');

      if (pageText.trim().length > 0) {
        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    const content = textParts.join('\n\n');

    return {
      content,
      metadata: {
        fileName,
        fileType,
        pageCount: pdf.numPages,
        parseTimestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new InputError(`Error parsing PDF: ${error}`);
  }
}

/**
 * Parse file based on its type
 * @param buffer - File buffer
 * @param fileName - File name
 * @param fileType - File type (md, txt, pdf, json, yaml, yml, log)
 * @returns Parsed document with content and metadata
 */
export async function parseFile(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<ParsedDocument> {
  // Normalize file type: lowercase and remove leading dot
  const normalizedType = fileType.toLowerCase().replace(/^\./, '');

  switch (normalizedType) {
    case SupportedFileType.MARKDOWN:
    case SupportedFileType.TEXT:
    case SupportedFileType.LOG:
      return parseTextFile(buffer, fileName, fileType);

    case SupportedFileType.JSON:
      return parseJSONFile(buffer, fileName, fileType);

    case SupportedFileType.YAML:
    case SupportedFileType.YML:
      return parseYAMLFile(buffer, fileName, fileType);

    case SupportedFileType.PDF:
      return parsePDFFile(buffer, fileName, fileType);

    default:
      throw new InputError(`Unsupported file type: ${fileType}`);
  }
}

/**
 * File-like object interface matching what toFile() returns
 */
export interface FileObject {
  name: string;
  stream: Readable;
  buffer: Buffer;
  type: string;
}

/**
 * Convert Buffer to File-like object for upload
 */
export async function toFile(
  buffer: Buffer,
  filename: string,
  options?: { type?: string },
): Promise<FileObject> {
  const stream = Readable.from(buffer);

  return {
    name: filename,
    stream,
    buffer,
    type: options?.type || 'application/octet-stream',
  };
}
