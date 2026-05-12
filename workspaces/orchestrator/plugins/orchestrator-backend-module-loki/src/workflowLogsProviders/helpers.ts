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

import type { Config } from '@backstage/config';

function hostnameMatchesAllowedHosts(
  hostname: string,
  allowedHosts: string[],
): boolean {
  const hostLower = hostname.toLowerCase();
  return allowedHosts.some(pattern => {
    const p = pattern.trim().toLowerCase();
    if (!p) {
      return false;
    }
    if (p.startsWith('.')) {
      const suffix = p.slice(1);
      return hostLower === suffix || hostLower.endsWith(`.${suffix}`);
    }
    return hostLower === p;
  });
}

/**
 * Parses baseUrl, applies scheme/host policy, and returns a normalized origin[+path] base
 * (no trailing slash) for appending Loki API paths.
 */
export function parseAndValidateLokiBaseUrl(options: {
  rawBaseUrl: string;
  allowedHosts?: string[];
  allowInsecureHttp?: boolean;
}): string {
  const trimmed = options.rawBaseUrl.trim();
  if (!trimmed) {
    throw new Error(
      'orchestrator.workflowLogProvider.loki.baseUrl must not be empty',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      `orchestrator.workflowLogProvider.loki.baseUrl must be a valid absolute URL, got "${trimmed}"`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new Error(
      'orchestrator.workflowLogProvider.loki.baseUrl must not include embedded credentials',
    );
  }

  if (parsed.search || parsed.hash) {
    throw new Error(
      'orchestrator.workflowLogProvider.loki.baseUrl must not include a query or fragment',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `orchestrator.workflowLogProvider.loki.baseUrl must use http: or https:, got "${parsed.protocol}"`,
    );
  }

  if (!parsed.hostname) {
    throw new Error(
      'orchestrator.workflowLogProvider.loki.baseUrl must include a hostname',
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (
    isProduction &&
    parsed.protocol === 'http:' &&
    options.allowInsecureHttp !== true
  ) {
    throw new Error(
      'orchestrator.workflowLogProvider.loki.baseUrl must use https in production (set allowInsecureHttp to true only if you explicitly require http)',
    );
  }

  const hosts = options.allowedHosts?.map(h => h.trim()).filter(Boolean) ?? [];
  if (
    hosts.length > 0 &&
    !hostnameMatchesAllowedHosts(parsed.hostname, hosts)
  ) {
    throw new Error(
      `orchestrator.workflowLogProvider.loki.baseUrl hostname "${parsed.hostname}" is not allowed by allowedHosts`,
    );
  }

  let pathname = parsed.pathname;
  while (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  return pathname ? `${parsed.origin}${pathname}` : parsed.origin;
}

/** Prometheus / Loki stream label names: `[a-zA-Z_]\w*` (ASCII `\w` only; no `/u` flag). */
const LOKI_LABEL_NAME_PATTERN = /^[a-zA-Z_]\w*$/;

/**
 * Label matcher fragment after the label name: `="..."`, `!=`, regex with `"` or `` ` ``.
 * Requires properly closed quotes and escapes so the fragment cannot break out of `{...}`.
 */
const LOG_STREAM_SELECTOR_VALUE_PATTERN =
  /^(?:(?:=|!=)"(?:[^"\\\r\n]|\\.)*"|(?:=~|!~)(?:"(?:[^"\\\r\n]|\\.)*"|`[^`\r\n]*`))$/;

export interface ValidatedLogStreamSelector {
  label: string;
  value: string;
}

function assertValidLokiLabelName(label: string, context: string): void {
  if (!LOKI_LABEL_NAME_PATTERN.test(label)) {
    throw new Error(
      `${context}: label must match Prometheus label name rules [a-zA-Z_]\\w* (got "${label}")`,
    );
  }
}

function assertValidLogStreamSelectorValue(
  value: string,
  context: string,
): void {
  if (!LOG_STREAM_SELECTOR_VALUE_PATTERN.test(value)) {
    throw new Error(
      `${context}: value must be a LogQL label matcher (e.g. ="literal", !="...", =~"re", or =~\`re\`) with no raw line breaks outside escapes`,
    );
  }
}

/**
 * Reads and validates `logStreamSelectors` at startup.
 */
export function parseAndValidateLogStreamSelectors(
  lokiConfig: Config,
  configKeyPath: string,
): ValidatedLogStreamSelector[] {
  const entries = lokiConfig.getOptionalConfigArray('logStreamSelectors');
  if (!entries?.length) {
    return [];
  }
  return entries.map((entry, i) => {
    const label = entry.getOptionalString('label') ?? 'openshift_log_type';
    const value = entry.getOptionalString('value') ?? '="application"';
    const ctxBase = `${configKeyPath}[${i}]`;
    assertValidLokiLabelName(label, ctxBase);
    assertValidLogStreamSelectorValue(value, ctxBase);
    return { label, value };
  });
}

/**
 * Reads and validates `logPipelineFilters` at startup.
 */
export function parseAndValidateLogPipelineFilters(
  lokiConfig: Config,
  configKeyPath: string,
): string[] {
  const filters = lokiConfig.getOptionalStringArray('logPipelineFilters');
  if (!filters?.length) {
    return [];
  }
  return filters.map((raw, i) => {
    const element = raw.trim();
    const ctx = `${configKeyPath}[${i}]`;
    if (!element) {
      throw new Error(`${ctx}: entry must not be empty or whitespace-only`);
    }
    if (/[\r\n\u2028\u2029]/.test(element)) {
      throw new Error(`${ctx}: entry must not contain line breaks`);
    }
    if (element.includes('}')) {
      throw new Error(`${ctx}: entry must not contain "}"`);
    }
    return element;
  });
}

function workflowInstanceIdHasDisallowedChars(id: string): boolean {
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    if (
      (c >= 0x00 && c <= 0x08) ||
      c === 0x0b ||
      c === 0x0c ||
      (c >= 0x0e && c <= 0x1f) ||
      c === 0x7f ||
      c === 0x0a ||
      c === 0x0d ||
      c === 0x2028 ||
      c === 0x2029
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Rejects instance ids that cannot be safely embedded in a LogQL line filter.
 */
export function assertSafeWorkflowInstanceIdForLineFilter(id: string): void {
  if (workflowInstanceIdHasDisallowedChars(id)) {
    throw new Error(
      'Workflow instance id contains characters that are not allowed in Loki line filters',
    );
  }
}

/**
 * Escapes a string for use inside LogQL double-quoted line filter literals (`|="..."`).
 */
export function escapeLogQlDoubleQuotedLineLiteral(fragment: string): string {
  return fragment.replaceAll(/\\/g, '\\\\').replaceAll(/"/g, '\\"');
}
