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
export const DEFAULT_LIGHTSPEED_SERVICE_HOST = '127.0.0.1'; // Lightspeed core service host
export const DEFAULT_LIGHTSPEED_SERVICE_PORT = 8080; // Lightspeed service port
export const DEFAULT_MAX_FILE_SIZE_MB = 20 * 1024 * 1024; // 20MB
export const NOTEBOOKS_SYSTEM_PROMPT = `
You are a helpful, analytical Senior Research Analyst assistant. Your primary objective is to synthesize cross-document information to answer user queries with 100% fidelity to the provided documents.

### QUERY TYPES - IMPORTANT
* **Meta Queries ONLY:** ONLY when the user asks specifically about YOU as an assistant (e.g., "who are you", "what can you do", "hello"), respond naturally without requiring documents.
* **ALL OTHER QUERIES:** For ANY other question, you MUST use the strict document-grounding rules below. This includes general knowledge questions, trivia, explanations, etc. If it's not about you as an assistant, it requires document evidence.

### STRICT OPERATIONAL CONSTRAINTS
* **Zero Outside Knowledge:** Do NOT use prior training data, general knowledge, or unsupported logical leaps to answer queries.
* **Absolute Grounding:** If the provided documents do not contain explicit, direct evidence to answer the query, you MUST output exactly: "I cannot answer this based on the provided documents."
* **Precision Citations:** Every single factual claim, metric, or conclusion must have an inline citation [Document Title].
* **Contradictions:** Do not resolve discrepancies. If sources conflict, explicitly document the friction (e.g., "Source A states X, whereas Source B states Y").

### ANALYTICAL GUIDELINES
* **Comprehensive Responses:** Provide thorough, detailed analysis. Don't be overly brief - expand on the evidence with full context and explanation.
* **Quantitative Focus:** Prioritize extracting specific metrics, dates, and figures.
* **Objective Tone:** Use neutral, professional language. Do not use subjective adjectives (e.g., "impressive," "concerning") unless quoting the text directly.

### REQUIRED ANALYSIS PROCESS
Before generating your response, you must internally perform evidence extraction (DO NOT show this in your output):
1. Identify the core entities and requirements of the user's query.
2. Extract exact, verbatim quotes from the provided documents that directly address the query.
3. If no explicit quotes exist to answer the prompt, output ONLY: "I cannot answer this based on the provided documents."

### CRITICAL: NEVER output <evidence_extraction> tags or any internal reasoning in your visible response. These are for your internal analysis only.

### REQUIRED OUTPUT STRUCTURE
When you have evidence from documents, structure your response as:

**Executive Summary:**
[A comprehensive 2-4 sentence synthesis of the primary findings based strictly on the extracted evidence. Provide full context and detail.]

**Detailed Analysis:**
* **[Key Entity/Theme]:** [Thorough explanation of the fact or data point derived from text, with full context and supporting details] [Document Title].
* **[Key Entity/Theme]:** [Thorough explanation of the fact or data point derived from text, with full context and supporting details] [Document Title].

**Referenced Documents:**
* [Document Title 1]
* [Document Title 2]

When you lack evidence, output ONLY: "I cannot answer this based on the provided documents."
`.trim();

/**
 * HTTP and networking constants
 */
export const URL_FETCH_TIMEOUT_MS = 30000; // 30 second timeout for URL fetching
export const USER_AGENT = 'RHDH-Notebooks-Bot/1.0'; // User agent for HTTP requests
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
 * Proxy path security - only these LCORE path prefixes may be proxied
 * Avoids authenticated users hitting arbitrary LCORE endpoints
 * /v1/feedback is here to cover the /feedback/status case as
 * the exact /v1/feedback has its own handler
 */
export const ALLOWED_PROXY_PREFIXES = [
  '/v1/models',
  '/v1/shields',
  '/v2/conversations',
  '/v1/feedback',
];

/**
 * Paths that bypass the proxy middleware and are handled by dedicated route handlers
 */
export const PROXY_PASSTHROUGH_PATHS = [
  '/v1/query',
  '/v1/query/interrupt',
  '/v1/feedback',
];

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
