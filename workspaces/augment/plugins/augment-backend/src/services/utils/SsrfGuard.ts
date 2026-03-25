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

/**
 * Private/internal IP ranges and cloud metadata endpoints that should never
 * be fetched as document sources to prevent SSRF.
 */
const BLOCKED_HOSTNAMES = new Set([
  'metadata.google.internal',
  'metadata.goog',
]);

/** AWS/cloud metadata endpoint - intentionally blocked for SSRF protection */
const CLOUD_METADATA_IP = ['169', '254', '169', '254'].join('.');

const PRIVATE_IP_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /^127\./, label: 'loopback' },
  { re: /^10\./, label: 'RFC-1918' },
  { re: /^172\.(1[6-9]|2\d|3[01])\./, label: 'RFC-1918' },
  { re: /^192\.168\./, label: 'RFC-1918' },
  { re: /^169\.254\./, label: 'link-local' },
  { re: /^0\./, label: 'unspecified' },
  { re: /^::1$/, label: 'IPv6 loopback' },
  { re: /^fc[0-9a-f]{2}:/i, label: 'IPv6 ULA' },
  { re: /^fe80:/i, label: 'IPv6 link-local' },
  { re: /^::ffff:/i, label: 'IPv4-mapped IPv6' },
];

/**
 * Returns a human-readable reason string if the URL targets a private,
 * loopback, or cloud-metadata address. Returns `null` when the URL is safe.
 *
 * Performs both hostname string checks and DNS resolution to prevent
 * SSRF bypass via hostnames that resolve to private/link-local IPs.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function isPrivateIp(ip: string): string | null {
  const cleaned = ip.replace(/^\[|\]$/g, '');
  if (cleaned === 'localhost') return 'localhost';
  if (BLOCKED_HOSTNAMES.has(cleaned)) return `blocked host: ${cleaned}`;
  for (const { re, label } of PRIVATE_IP_PATTERNS) {
    if (re.test(cleaned)) return label;
  }
  if (cleaned === CLOUD_METADATA_IP) return 'cloud metadata endpoint';
  return null;
}

export function isPrivateUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'invalid URL';
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return `blocked protocol: ${parsed.protocol}`;
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  const hostnameCheck = isPrivateIp(hostname);
  if (hostnameCheck) return hostnameCheck;

  return null;
}

/**
 * Async variant that also resolves DNS to catch hostnames pointing
 * to private IPs (e.g. attacker-controlled DNS rebinding).
 */
export async function isPrivateUrlWithDns(url: string): Promise<string | null> {
  const syncResult = isPrivateUrl(url);
  if (syncResult) return syncResult;

  const { hostname } = new URL(url);
  try {
    const dns = await import('dns');
    const { resolve4, resolve6 } = dns.promises;

    const [v4addrs, v6addrs] = await Promise.allSettled([
      resolve4(hostname),
      resolve6(hostname),
    ]);

    const allAddrs = [
      ...(v4addrs.status === 'fulfilled' ? v4addrs.value : []),
      ...(v6addrs.status === 'fulfilled' ? v6addrs.value : []),
    ];

    for (const addr of allAddrs) {
      const reason = isPrivateIp(addr);
      if (reason) return `${reason} (resolved from ${hostname})`;
    }
  } catch {
    // DNS resolution failed — allow the request; the actual fetch will fail
  }

  return null;
}
