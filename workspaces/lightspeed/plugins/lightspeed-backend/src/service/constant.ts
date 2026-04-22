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
export const DEFAULT_CHUNKING_STRATEGY_TYPE = 'auto'; // auto chunking
export const DEFAULT_MAX_CHUNK_SIZE_TOKENS = 512; // 512 tokens
export const DEFAULT_CHUNK_OVERLAP_TOKENS = 50; // 50 tokens
export const DEFAULT_LLAMA_STACK_PORT = 8321; // Llama Stack port
export const DEFAULT_LIGHTSPEED_SERVICE_HOST = 'localhost'; // Lightspeed core service host
export const DEFAULT_LIGHTSPEED_SERVICE_PORT = 8080; // Lightspeed service port
export const DEFAULT_MAX_FILE_SIZE_MB = 20 * 1024 * 1024; // 20MB
export const NOTEBOOKS_SYSTEM_PROMPT =
  `You are an expert Research Analyst. Your goal is to synthesize information across provided documents to answer user queries with high precision.

Constraints:
- Groundedness: Only use information explicitly stated in or directly inferred from the documents. If the answer isn't present, state: "I don't know based on the provided documents."
- Citations: Every claim must be followed by an inline citation (e.g., [Document Title/Id]).
- Tone: Maintain a professional, objective, and analytical tone.
- Conflicting Info: If documents contradict each other, highlight the discrepancy rather than choosing one.

Output Format:
1. Summary: A 1-2 sentence high-level answer.
2. Detailed Analysis: A structured breakdown using bullet points.
3. References: A list of sources used.

Disclaimer: Your answers **MUST** be grounded in the provided documents. If the answer isn't present, state: "I don't know based on the provided documents."
Make no mistakes.
`.trim();

/**
 * HTTP and networking constants
 */
export const URL_FETCH_TIMEOUT_MS = 30000; // 30 second timeout for URL fetching
export const USER_AGENT = 'RHDH-AI-Notebooks-Bot/1.0'; // User agent for HTTP requests
export const MAX_URL_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB max for URL fetched content

/**
 * HTTP status codes
 */
export const HTTP_STATUS_ACCEPTED = 202; // Async operation accepted
export const HTTP_STATUS_BAD_REQUEST = 400; // Bad request
export const HTTP_STATUS_FORBIDDEN = 403; // Forbidden
export const HTTP_STATUS_NOT_FOUND = 404; // Not found
export const HTTP_STATUS_CONFLICT = 409; // Conflict
export const HTTP_STATUS_INTERNAL_ERROR = 500; // Internal server error

/**
 * SSRF Protection - Blocked hostnames for security
 * These hostnames are commonly used for Server-Side Request Forgery attacks
 */
export const SSRF_BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal', // GCP metadata endpoint
  'kubernetes.default.svc', // Kubernetes internal DNS
  'host.docker.internal', // Docker host access
  '169.254.169.254', // AWS/Azure/GCP metadata IP
  '127.0.0.1', // IPv4 loopback
  '0.0.0.0', // IPv4 any address
  '::1', // IPv6 loopback
  '::', // IPv6 any address
] as const;

/**
 * Prompt Injection Protection - Patterns to detect and sanitize
 * These patterns are commonly used in prompt injection attacks
 */
export const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
  /disregard\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
  /forget\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
  /you\s+are\s+now\s+(a\s+)?different/gi,
  /new\s+(instructions?|prompts?)\s*:/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\|endoftext\|>/gi,
  /\[SYSTEM\]/gi,
  /\[\/SYSTEM\]/gi,
  /\[ASSISTANT\]/gi,
  /\[\/ASSISTANT\]/gi,
] as const;

/**
 * Content sanitization constants
 */
export const MAX_CONSECUTIVE_NEWLINES = 4; // Max consecutive newlines allowed in content
export const FILTERED_CONTENT_MARKER = '[CONTENT_FILTERED]'; // Marker for filtered content

/**
 * File type to MIME type mapping
 */
export const FILE_TYPE_TO_MIME: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
  log: 'text/plain',
  json: 'application/json',
  yaml: 'application/x-yaml',
  yml: 'application/x-yaml',
  pdf: 'application/pdf',
  url: 'text/plain', // URLs are stored as plain text content
};

export const MAX_QUERY_RETRIES = 1; // Max number of retries for query

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DEFAULT_MAX_FILE_SIZE_MB,
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

export const POLL_INTERVAL_MS = 1000; // 1 second
