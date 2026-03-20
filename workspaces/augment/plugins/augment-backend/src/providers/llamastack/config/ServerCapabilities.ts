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

import type { LoggerService } from '@backstage/backend-plugin-api';

/**
 * Describes what the connected Llama Stack server supports.
 *
 * Capabilities are resolved once via `resolveCapabilities()` using a
 * three-layer strategy:
 *   1. Version-based hints from `GET /v1/version`
 *   2. Explicit overrides from `app-config.yaml`
 *   3. Runtime downgrade when a request fails with a validation error
 *      that mentions the unsupported feature (handled by callers)
 *
 * Unknown or unparseable versions default to "assume latest" so that
 * the plugin works with custom/forked Llama Stack builds.
 */
export interface ServerCapabilities {
  /** Can send `{ type: 'function' }` tools */
  functionTools: boolean;
  /** Can include the `strict` field on function tools */
  strictField: boolean;
  /** Can send `max_output_tokens` in the request */
  maxOutputTokens: boolean;
  /** Can send `{ type: 'mcp' }` tools */
  mcpTools: boolean;
  /** Supports `parallel_tool_calls` parameter */
  parallelToolCalls: boolean;
  /** Supports `truncation` parameter for context window management */
  truncation: boolean;
}

/** Optional overrides from app-config.yaml `augment.serverCapabilities`. */
export interface ServerCapabilityOverrides {
  functionTools?: boolean;
  strictField?: boolean;
  maxOutputTokens?: boolean;
  mcpTools?: boolean;
  parallelToolCalls?: boolean;
  truncation?: boolean;
}

/**
 * Parse a semver-style version string into [major, minor, patch].
 * Returns `null` if the version is missing or unparseable.
 */
export function parseVersion(
  version: string | undefined,
): [number, number, number] | null {
  if (!version) return null;
  const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

/**
 * Derive default capabilities from a server version.
 *
 * Version timeline (from upstream Llama Stack PRs):
 * - 0.3.x: function tools supported (PR #2094, May 2025), but `strict`
 *   field can cause null-serialization errors (fixed in 0.6.0)
 * - 0.4.0: Tool calling stability fix (PR #3385, Oct 2025)
 * - 0.6.0: `strict` field fix, `max_output_tokens` Pydantic fix
 */
function defaultsForVersion(
  parsed: [number, number, number] | null,
): ServerCapabilities {
  if (!parsed) {
    return {
      functionTools: true,
      strictField: true,
      maxOutputTokens: true,
      mcpTools: true,
      parallelToolCalls: true,
      truncation: false,
    };
  }

  const [major, minor] = parsed;
  const atLeast = (m: number, n: number) =>
    major > m || (major === m && minor >= n);

  return {
    functionTools: true,
    strictField: atLeast(0, 6),
    maxOutputTokens: atLeast(0, 6),
    mcpTools: true,
    parallelToolCalls: true,
    truncation: atLeast(0, 6),
  };
}

/**
 * Resolve server capabilities by merging version-based defaults with
 * explicit overrides from configuration. Override values take precedence;
 * `undefined` override entries fall through to the version-based default.
 */
export function resolveCapabilities(
  serverVersion: string | undefined,
  overrides: ServerCapabilityOverrides | undefined,
  logger: LoggerService,
): ServerCapabilities {
  const parsed = parseVersion(serverVersion);
  const defaults = defaultsForVersion(parsed);

  const caps: ServerCapabilities = { ...defaults };

  if (overrides) {
    for (const key of Object.keys(overrides) as Array<
      keyof ServerCapabilityOverrides
    >) {
      if (overrides[key] !== undefined) {
        (caps as unknown as Record<string, boolean>)[key] = overrides[key]!;
      }
    }
  }

  logger.debug(
    `[ServerCapabilities] version=${serverVersion ?? 'unknown'}, caps=${JSON.stringify(caps)}${overrides ? `, overrides=${JSON.stringify(overrides)}` : ''}`,
  );

  if (parsed && !caps.strictField) {
    logger.info(
      `[ServerCapabilities] strict field disabled — function tools will omit 'strict' to avoid validation errors on Llama Stack ${serverVersion}`,
    );
  }

  return caps;
}

/**
 * Check if a Llama Stack API error indicates an unsupported tool type
 * or schema validation failure related to tools. Used for runtime
 * capability downgrade.
 */
export function isToolCompatibilityError(errorMessage: string): boolean {
  return /unsupported.*tool.*type|tool.*type.*unsupported|function.*tool.*type|unknown.*tool.*type|extra.*input.*strict.*tool|validation.*error.*tool/i.test(
    errorMessage,
  );
}
