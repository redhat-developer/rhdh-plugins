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

import type { McpServerDocument } from '@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common';

/**
 * A single server entry from the MCP Registry list response.
 */
export interface McpRegistryServerEntry {
  server: McpServerDocument;
}

/**
 * The MCP Registry servers list response shape.
 */
export interface McpRegistryListResponse {
  servers: McpRegistryServerEntry[];
  metadata: {
    count?: number;
    nextCursor?: string | null;
  };
}

/**
 * Error thrown when the registry client encounters a transport or
 * protocol error that should abort the sync run.
 */
export class McpRegistryClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpRegistryClientError';
  }
}

/**
 * Build the servers endpoint URL from baseUrl and apiVersion,
 * normalizing slashes so a trailing slash on baseUrl does not
 * produce a double separator.
 */
export function buildServersEndpoint(
  baseUrl: string,
  apiVersion: string,
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  return `${normalizedBase}/${apiVersion}/servers`;
}

/**
 * Options for fetching servers from the MCP Registry.
 */
export interface FetchServersOptions {
  baseUrl: string;
  apiVersion: string;
  pageLimit: number;
  pageSize?: number;
  /** Optional fetch implementation for testing. */
  fetchApi?: typeof fetch;
}

/**
 * Fetch all server entries from the MCP Registry using cursor
 * pagination. Accumulates entries across pages and enforces
 * pagination safeguards (page cap, repeated cursor).
 *
 * @throws McpRegistryClientError on transport, protocol, or
 *   pagination-safeguard errors.
 */
export async function fetchRegistryServers(
  options: FetchServersOptions,
): Promise<McpRegistryServerEntry[]> {
  const { baseUrl, apiVersion, pageLimit, pageSize, fetchApi } = options;
  const doFetch = fetchApi ?? fetch;

  const endpoint = buildServersEndpoint(baseUrl, apiVersion);

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch (err) {
    throw new McpRegistryClientError(
      `Invalid MCP Registry endpoint URL "${endpoint}": ${err}`,
    );
  }

  const allServers: McpRegistryServerEntry[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let pageCount = 0;

  let hasMorePages = true;
  while (hasMorePages) {
    // Build request URL with query params
    const url = new URL(parsedEndpoint.toString());
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }
    if (pageSize !== undefined) {
      url.searchParams.set('limit', String(pageSize));
    }

    let response: Response;
    try {
      response = await doFetch(url.toString());
    } catch (err) {
      throw new McpRegistryClientError(
        `Failed to reach MCP Registry at ${url.toString()}: ${err}`,
      );
    }

    if (!response.ok) {
      const MAX_BODY_LENGTH = 256;
      const rawBody = await response.text().catch(() => '(no body)');
      const truncatedBody =
        rawBody.length > MAX_BODY_LENGTH
          ? `${rawBody.substring(0, MAX_BODY_LENGTH)}…(truncated)`
          : rawBody;
      throw new McpRegistryClientError(
        `MCP Registry returned HTTP ${response.status} for ` +
          `${url.toString()}: ${truncatedBody}`,
      );
    }

    let body: McpRegistryListResponse;
    try {
      body = (await response.json()) as McpRegistryListResponse;
    } catch (err) {
      throw new McpRegistryClientError(
        `MCP Registry returned unparseable JSON from ` +
          `${url.toString()}: ${err}`,
      );
    }

    if (!body.servers || !Array.isArray(body.servers)) {
      throw new McpRegistryClientError(
        `MCP Registry response missing "servers" array from ` +
          `${url.toString()}`,
      );
    }

    allServers.push(...body.servers);
    pageCount++;

    // Check for next cursor
    const nextCursor = body.metadata?.nextCursor;
    if (!nextCursor || nextCursor.length === 0) {
      // No more pages
      hasMorePages = false;
      continue;
    }

    // Repeated cursor safeguard
    if (seenCursors.has(nextCursor)) {
      throw new McpRegistryClientError(
        `MCP Registry returned a repeated cursor "${nextCursor}" ` +
          `during pagination. Aborting sync to prevent infinite loop.`,
      );
    }
    seenCursors.add(nextCursor);

    // Page limit safeguard: if we've fetched pageLimit pages and
    // there's still a nextCursor, fail the run
    if (pageCount >= pageLimit) {
      throw new McpRegistryClientError(
        `MCP Registry pagination exceeded the configured page limit ` +
          `of ${pageLimit} pages per sync. The registry still has more ` +
          `pages (nextCursor present). Increase pageLimit to fetch ` +
          `more pages.`,
      );
    }

    cursor = nextCursor;
  }

  return allServers;
}
