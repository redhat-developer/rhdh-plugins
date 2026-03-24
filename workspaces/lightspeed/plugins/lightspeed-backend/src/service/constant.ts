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
import multer from 'multer';

/**
 * Default values for AI Notebooks
 */
export const DEFAULT_FILE_PROCESSING_TIMEOUT_MS = 30000; // 30 seconds
export const DEFAULT_CHUNKING_STRATEGY_TYPE = 'auto'; // auto chunking
export const DEFAULT_MAX_CHUNK_SIZE_TOKENS = 512; // 512 tokens
export const DEFAULT_CHUNK_OVERLAP_TOKENS = 50; // 50 tokens
export const DEFAULT_LLAMA_STACK_PORT = 8321; // Llama Stack port
export const DEFAULT_LIGHTSPEED_SERVICE_PORT = 8080; // Lightspeed service port
export const DEFAULT_MAX_FILE_SIZE_MB = 20; // 20MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

/**
 * Supported file types for document upload AI Notebooks
 */
export enum SupportedFileType {
  MARKDOWN = 'md',
  TEXT = 'txt',
  PDF = 'pdf',
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
  LOG = 'log',
  URL = 'url',
}

export const HTML_BLOCK_TAGS = new Set([
  'div',
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'tr',
  'section',
  'article',
  'header',
  'footer',
]);
export const HTML_IGNORED_TAGS = new Set(['script', 'style']);
