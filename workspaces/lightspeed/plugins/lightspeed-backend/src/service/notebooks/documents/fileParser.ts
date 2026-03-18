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

import { SupportedFileType } from '../../constant';
import {
  isValidFileType,
  isValidURL,
  stripHtmlTags,
  validateURLForSSRF,
} from './documentHelpers';

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
    throw new Error(`Error parsing PDF: ${error}`);
  }
}

/**
 * Parse URL and fetch web content
 * Fetches HTML from URL and extracts readable text
 */
async function parseURLFile(
  url: string,
  fileName: string,
  fileType: string,
): Promise<ParsedDocument> {
  try {
    // Validate URL format
    if (!isValidURL(url)) {
      throw new InputError(`Invalid URL format: ${url}`);
    }

    // Validate URL for SSRF vulnerabilities
    await validateURLForSSRF(url);

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RHDH-AI-Notebooks-Bot/1.0',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL: ${response.status} ${response.statusText}`,
      );
    }

    // Get content type to determine how to parse
    const contentType = response.headers.get('content-type') || '';

    let content: string;

    if (contentType.includes('text/html')) {
      // HTML content - strip tags and extract text
      const html = await response.text();
      content = stripHtmlTags(html);
    } else if (
      contentType.includes('text/plain') ||
      contentType.includes('text/markdown')
    ) {
      // Plain text or markdown - use as is
      content = await response.text();
    } else if (contentType.includes('application/json')) {
      // JSON content - validate but keep original
      const text = await response.text();
      JSON.parse(text); // Validate it's valid JSON
      content = text;
    } else {
      // Try to get as text anyway
      content = await response.text();
    }

    // Validate we got some content
    if (!content || content.trim().length === 0) {
      throw new Error('No content extracted from URL');
    }

    return {
      content,
      metadata: {
        fileName: fileName || new URL(url).hostname,
        fileType,
        url,
        parseTimestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching URL: ${error.message}`);
    }
    throw new Error(`Error fetching URL: ${error}`);
  }
}

/**
 * Parse file based on its type
 * For URL type, fileName parameter should contain the URL string
 */
export async function parseFile(
  buffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<ParsedDocument> {
  const normalizedType = fileType
    .toLowerCase()
    .replace(/^\./, '') as SupportedFileType;

  if (!isValidFileType(normalizedType)) {
    throw new InputError(`Unsupported file type: ${fileType}`);
  }

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

    case SupportedFileType.URL:
      // For URL type, fileName contains the URL
      return parseURLFile(fileName, fileName, fileType);

    default:
      throw new InputError(`Unsupported file type: ${fileType}`);
  }
}
