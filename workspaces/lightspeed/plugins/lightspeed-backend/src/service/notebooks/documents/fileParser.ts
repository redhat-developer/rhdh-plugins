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

import {
  MAX_URL_CONTENT_SIZE,
  SupportedFileType,
  URL_FETCH_TIMEOUT_MS,
  USER_AGENT,
} from '../../constant';
import {
  isValidFileType,
  isValidURL,
  sanitizeContentForRAG,
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
    throw new InputError(`Error parsing PDF: ${error}`);
  }
}

/**
 * Parse URL and fetch web content
 * Fetches HTML from URL and extracts readable text
 * @param url - URL to fetch
 * @param fileName - File name for metadata
 * @param fileType - File type
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
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(URL_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new InputError(
        `Failed to fetch URL: ${response.status} ${response.statusText}`,
      );
    }

    // Check Content-Length header to prevent fetching huge files
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_URL_CONTENT_SIZE) {
        throw new InputError(
          `URL content size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(MAX_URL_CONTENT_SIZE / 1024 / 1024)}MB)`,
        );
      }
    }

    // Get content type to determine how to parse
    const contentType = response.headers.get('content-type') || '';

    // Stream response body with size limit
    let content: string;
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const chunks: string[] = [];
      let totalSize = 0;

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          totalSize += value.length;
          if (totalSize > MAX_URL_CONTENT_SIZE) {
            throw new InputError(
              `URL content exceeds maximum allowed size (${Math.round(MAX_URL_CONTENT_SIZE / 1024 / 1024)}MB)`,
            );
          }

          chunks.push(decoder.decode(value, { stream: true }));
        }
        chunks.push(decoder.decode()); // Flush remaining bytes
        content = chunks.join('');
      } finally {
        reader.releaseLock();
      }
    } else {
      throw new InputError('Response body is not available');
    }

    // Parse content based on content type
    let parsedContent: string;

    if (contentType.includes('text/html')) {
      // HTML content - strip tags and extract text
      parsedContent = stripHtmlTags(content);
    } else if (
      contentType.includes('text/plain') ||
      contentType.includes('text/markdown')
    ) {
      // Plain text or markdown - use as is
      parsedContent = content;
    } else if (contentType.includes('application/json')) {
      // JSON content - validate but keep original
      JSON.parse(content); // Validate it's valid JSON
      parsedContent = content;
    } else {
      // Try to use as text anyway
      parsedContent = content;
    }

    // Validate we got some content
    if (!parsedContent || parsedContent.trim().length === 0) {
      throw new InputError('No content extracted from URL');
    }

    // Sanitize content to prevent prompt injection attacks
    const sanitizedContent = sanitizeContentForRAG(parsedContent);

    return {
      content: sanitizedContent,
      metadata: {
        fileName: fileName || new URL(url).hostname,
        fileType,
        url,
        parseTimestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    // Re-throw InputError from validation functions unchanged
    if (error instanceof InputError) {
      throw error;
    }
    // Convert other errors to InputError
    if (error instanceof Error) {
      throw new InputError(`Error fetching URL: ${error.message}`);
    }
    throw new InputError(`Error fetching URL: ${error}`);
  }
}

/**
 * Parse file based on its type
 * @param buffer - File buffer (ignored for URL type)
 * @param fileName - File name, or URL string when fileType is 'url'
 * @param fileType - File type (md, txt, pdf, json, yaml, yml, log, url)
 * @returns Parsed document with content and metadata
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
