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

import { isAllowedUrl } from '@red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping';
import type { McpServerDocument } from '@red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping';
import type { McpRegistryServerEntry } from './client';
import { formatErrorDetail } from './util';

/**
 * Whether a server.json document declares at least one native remote
 * (non-empty type and D11-valid URL). Matches the mapping's copy rules
 * for remotes that become `spec.remotes` rather than D8 placeholders.
 *
 * @internal
 */
export function hasNativeRemote(doc: McpServerDocument | undefined): boolean {
  const remotes = doc?.remotes ?? [];
  for (const remote of remotes) {
    if (
      typeof remote.type === 'string' &&
      remote.type.length > 0 &&
      remote.url !== undefined &&
      remote.url !== null &&
      isAllowedUrl(remote.url)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Build a last-good lookup key from name and version.
 *
 * @internal
 */
export function buildLastGoodKey(name: string, version: string): string {
  return `${name}::${version}`;
}

/**
 * Read optional name/version from a registry list entry.
 *
 * @internal
 */
export function readServerIdentity(
  entry: McpRegistryServerEntry | null | undefined,
): {
  name?: string;
  version?: string;
} {
  const serverDoc = entry?.server;
  return {
    name: typeof serverDoc?.name === 'string' ? serverDoc.name : undefined,
    version:
      typeof serverDoc?.version === 'string' ? serverDoc.version : undefined,
  };
}

/**
 * Format the per-entry mapping failure warning.
 *
 * @internal
 */
export function formatMappingFailureMessage(
  name: string | undefined,
  version: string | undefined,
  err: unknown,
): string {
  let message = 'Failed to map MCP Registry server entry';
  if (name) {
    message += ` "${name}"`;
  }
  if (version) {
    message += ` (version "${version}")`;
  }
  return `${message}: ${formatErrorDetail(err)}`;
}
