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

import type {
  ErrorType,
  ErrorSummary,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

/**
 * Options for error classification.
 *
 * @public
 */
export interface ClassifyOptions {
  /** Connector type for provider-specific error matching. */
  connectorType?: string;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface ErrorPattern {
  type: ErrorType;
  test: (message: string, statusCode?: number) => boolean;
  guidance: string;
}

/**
 * Auth failure patterns — 401/403, invalid tokens, OAuth expiry.
 */
const AUTH_PATTERNS: ErrorPattern[] = [
  {
    type: 'auth',
    test: (msg, status) =>
      status === 403 ||
      /403\s+forbidden/i.test(msg) ||
      /insufficient\s+(scopes?|permissions?)/i.test(msg),
    guidance:
      'Service account lacks required permissions. Verify API token has read access to required resources (repositories, projects, issues).',
  },
  {
    type: 'auth',
    test: (msg, status) =>
      status === 401 ||
      /401\s+unauthorized/i.test(msg) ||
      /invalid\s+(api\s+)?token/i.test(msg) ||
      /authentication\s+failed/i.test(msg),
    guidance:
      'Check service account credentials in connector config. Verify API token is valid and has required permissions.',
  },
  {
    type: 'auth',
    test: msg =>
      /oauth\s+token\s+expired/i.test(msg) ||
      /access\s+token\s+expired/i.test(msg) ||
      /refresh\s+token\s+invalid/i.test(msg),
    guidance:
      'OAuth token expired. Re-authenticate the connector in admin panel or refresh the access token.',
  },
];

/**
 * Network failure patterns — ECONNREFUSED, ETIMEDOUT, DNS, TLS.
 */
const NETWORK_PATTERNS: ErrorPattern[] = [
  {
    type: 'network',
    test: msg =>
      /UNABLE_TO_VERIFY_LEAF_SIGNATURE/i.test(msg) ||
      /self\s+signed\s+certificate/i.test(msg) ||
      /ERR_TLS/i.test(msg) ||
      /(?:ssl|tls|x509|ca).*certificate|certificate.*(?:expired|chain|verify|untrusted)/i.test(
        msg,
      ),
    guidance:
      'TLS/SSL certificate verification failed. Verify certificate chain or configure connector to trust custom CA certificates.',
  },
  {
    type: 'network',
    test: msg => /ENOTFOUND/i.test(msg) || /dns\s+lookup\s+failed/i.test(msg),
    guidance:
      'DNS resolution failed. Verify DNS configuration and external service hostname. In disconnected clusters, this is expected for external services—consider disabling the connector.',
  },
  {
    type: 'network',
    test: msg =>
      /ECONNREFUSED/i.test(msg) ||
      /ETIMEDOUT/i.test(msg) ||
      /ECONNRESET/i.test(msg) ||
      /network\s+unreachable/i.test(msg) ||
      /socket\s+hang\s+up/i.test(msg),
    guidance:
      'Network connectivity issue. Verify DNS resolution, firewall rules, and external service availability. In air-gapped clusters, disable connectors for unreachable external services.',
  },
];

/**
 * Rate limit patterns — 429, X-RateLimit headers.
 */
const RATE_LIMIT_PATTERNS: ErrorPattern[] = [
  {
    type: 'rate-limit',
    test: msg => /secondary\s+rate\s+limit/i.test(msg),
    guidance:
      'Secondary rate limit triggered (too many requests in short period). Connector will back off and retry. Consider reducing sync frequency.',
  },
  {
    type: 'rate-limit',
    test: (msg, status) =>
      status === 429 ||
      /429\s+too\s+many\s+requests/i.test(msg) ||
      /rate\s+limit\s+exceeded/i.test(msg) ||
      /X-RateLimit-Remaining:\s*0/i.test(msg),
    guidance:
      'API rate limit exceeded. Connector will retry on next scheduled sync. Consider increasing sync interval or requesting higher rate limits from service provider.',
  },
];

/**
 * Schema mismatch patterns — JSON parsing, unexpected fields, GraphQL.
 */
const SCHEMA_PATTERNS: ErrorPattern[] = [
  {
    type: 'schema',
    test: msg =>
      /cannot\s+query\s+field/i.test(msg) ||
      /field\s+'[^']+'\s+doesn'?t\s+exist\s+on\s+type/i.test(msg),
    guidance:
      'GraphQL query schema mismatch. Upstream GraphQL schema may have changed. Review connector GraphQL queries against current API schema.',
  },
  {
    type: 'schema',
    test: msg =>
      /unexpected\s+token.*in\s+json/i.test(msg) ||
      /syntaxerror:\s*json\.parse/i.test(msg) ||
      /failed\s+to\s+parse/i.test(msg),
    guidance:
      'Failed to parse API response. Upstream service may be returning HTML error page or malformed JSON. Check connector logs for raw response body.',
  },
  {
    type: 'schema',
    test: msg =>
      /unexpected\s+field/i.test(msg) ||
      /missing\s+required\s+field/i.test(msg) ||
      /schema\s+mismatch/i.test(msg),
    guidance:
      'API response schema mismatch. This may indicate an upstream API version change. Check connector logs for expected vs actual schema and consider updating the connector.',
  },
];

// ---------------------------------------------------------------------------
// Connector-specific matchers
// ---------------------------------------------------------------------------

const CONNECTOR_SPECIFIC_PATTERNS: Record<string, ErrorPattern[]> = {
  github: [
    {
      type: 'rate-limit',
      test: msg =>
        /you\s+have\s+exceeded\s+a\s+secondary\s+rate\s+limit/i.test(msg),
      guidance:
        'Secondary rate limit triggered (too many requests in short period). Connector will back off and retry. Consider reducing sync frequency.',
    },
  ],
  jira: [
    {
      type: 'auth',
      test: msg =>
        /client\s+must\s+be\s+authenticated/i.test(msg) ||
        /oauth\s+credentials/i.test(msg),
      guidance:
        'Jira Cloud authentication failed. Verify OAuth credentials and ensure the app has the required scopes.',
    },
  ],
  gitlab: [
    {
      type: 'auth',
      test: msg => /personal\s+access\s+token/i.test(msg),
      guidance:
        'GitLab authentication failed. Verify personal access token is valid and has api/read_api scope.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Default guidance (when type is known but message reclassification differs)
// ---------------------------------------------------------------------------

const DEFAULT_GUIDANCE: Record<ErrorType, string> = {
  auth: 'Check service account credentials in connector config. Verify API token is valid and has required permissions.',
  network:
    'Network connectivity issue. Verify DNS resolution, firewall rules, and external service availability. In air-gapped clusters, disable connectors for unreachable external services.',
  schema:
    'API response schema mismatch. This may indicate an upstream API version change. Check connector logs for expected vs actual schema and consider updating the connector.',
  'rate-limit':
    'API rate limit exceeded. Connector will retry on next scheduled sync. Consider increasing sync interval or requesting higher rate limits from service provider.',
  unknown:
    'Unknown error occurred. Check connector logs for detailed error trace and stack trace.',
};

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

/**
 * Extracts a string message from an error of any shape.
 *
 * @internal
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return String(error);
}

/**
 * Extracts an HTTP status code from an error if available.
 *
 * @internal
 */
function extractStatusCode(error: unknown): number | undefined {
  if (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as Record<string, unknown>).statusCode === 'number'
  ) {
    return (error as Record<string, unknown>).statusCode as number;
  }
  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  ) {
    return (error as Record<string, unknown>).status as number;
  }
  return undefined;
}

/**
 * Classifies connector sync errors into actionable categories with
 * diagnostic guidance.
 *
 * Classification is connector-agnostic by default. Connector-specific
 * matchers can be activated via `options.connectorType`.
 *
 * @public
 */
export class ErrorClassifier {
  /**
   * Return canonical diagnostic guidance for an error type.
   *
   * Used when a stored `errorType` is preferred over message
   * reclassification so type and guidance stay aligned.
   *
   * @param errorType - The error category.
   * @returns Actionable guidance for that category.
   */
  static guidanceFor(errorType: ErrorType): string {
    return DEFAULT_GUIDANCE[errorType];
  }

  /**
   * Classify an error into a category with diagnostic guidance.
   *
   * @param error - The error to classify (Error, string, or object
   *   with message/statusCode).
   * @param options - Optional classification options.
   * @returns An error summary with type, message, and guidance.
   */
  static classify(error: unknown, options?: ClassifyOptions): ErrorSummary {
    const message = extractErrorMessage(error);
    const statusCode = extractStatusCode(error);

    // Connector-specific matchers run first so they can override base
    // classification (e.g., GitHub secondary rate limit).
    if (options?.connectorType) {
      const specific =
        CONNECTOR_SPECIFIC_PATTERNS[options.connectorType.toLowerCase()];
      if (specific) {
        for (const pattern of specific) {
          if (pattern.test(message, statusCode)) {
            return {
              errorType: pattern.type,
              errorMessage: message,
              diagnosticGuidance: pattern.guidance,
            };
          }
        }
      }
    }

    // Base classification: auth → network → rate-limit → schema → unknown
    const allPatterns = [
      ...AUTH_PATTERNS,
      ...NETWORK_PATTERNS,
      ...RATE_LIMIT_PATTERNS,
      ...SCHEMA_PATTERNS,
    ];

    for (const pattern of allPatterns) {
      if (pattern.test(message, statusCode)) {
        return {
          errorType: pattern.type,
          errorMessage: message,
          diagnosticGuidance: pattern.guidance,
        };
      }
    }

    // Unknown error fallback
    return {
      errorType: 'unknown',
      errorMessage: message,
      diagnosticGuidance: ErrorClassifier.guidanceFor('unknown'),
    };
  }
}
