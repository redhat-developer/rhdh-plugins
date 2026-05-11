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
