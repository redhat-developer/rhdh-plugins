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

import * as net from 'net';
import * as dns from 'dns';
import { promisify } from 'util';
import { InputError } from '@backstage/errors';

const dnsLookup = promisify(dns.lookup);

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

export function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') {
    return true;
  }
  if (net.isIPv4(hostname)) {
    return PRIVATE_IP_RANGES.some(r => r.test(hostname));
  }
  const bare = hostname.replace(/^\[|\]$/g, '');
  if (net.isIPv6(bare)) {
    const lower = bare.toLowerCase();
    if (
      lower === '::1' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd')
    ) {
      return true;
    }
    if (lower.startsWith('::ffff:')) {
      const mapped = lower.substring(7);
      if (net.isIPv4(mapped)) {
        return PRIVATE_IP_RANGES.some(r => r.test(mapped));
      }
    }
    return false;
  }
  return false;
}

const MAX_URL_LENGTH = 2048;

/**
 * Validates that a URL is safe to fetch from the server side.
 * Rejects private/internal addresses, non-HTTP protocols,
 * URLs with embedded credentials, and URLs that are too long.
 *
 * NOTE: This check is pre-connect only. If the downstream HTTP client
 * follows redirects, each hop should be re-validated against isPrivateHost.
 * Ensure KagentiApiClient.fetchEnvUrl does NOT follow redirects to
 * internal addresses.
 */
export async function validatePublicUrl(url: string): Promise<void> {
  if (url.length > MAX_URL_LENGTH) {
    throw new InputError(
      `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
    );
  }

  const parsed = new URL(url);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new InputError('Only http and https URLs are allowed');
  }

  if (parsed.username || parsed.password) {
    throw new InputError('URLs with embedded credentials are not allowed');
  }

  const hostname = parsed.hostname;
  if (isPrivateHost(hostname)) {
    throw new InputError(
      'Requests to private/internal addresses are not allowed',
    );
  }

  if (!net.isIPv4(hostname) && !net.isIPv6(hostname.replace(/^\[|\]$/g, ''))) {
    try {
      const { address } = await dnsLookup(hostname, { family: 0 });
      if (isPrivateHost(address)) {
        throw new InputError('URL resolves to a private/internal address');
      }
    } catch (dnsErr) {
      if (dnsErr instanceof InputError) throw dnsErr;
      throw new InputError(`DNS resolution failed for ${hostname}`);
    }
  }
}
