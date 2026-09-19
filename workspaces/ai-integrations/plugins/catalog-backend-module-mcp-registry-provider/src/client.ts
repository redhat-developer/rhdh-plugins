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
import { stripTrailingSlashes } from './util';

/** Max characters of an error response body included in client errors. */
const MAX_ERROR_BODY_LENGTH = 256;

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
  return `${stripTrailingSlashes(baseUrl)}/${apiVersion}/servers`;
}

/**
 * Options for fetching servers from the MCP Registry.
 */
export interface FetchServersOptions {
  baseUrl: string;
  apiVersion: string;
  pageLimit: number;
  pageSize?: number;
  /**
   * Maximum total entries accumulated across all pages. When exceeded
   * the sync aborts to prevent unbounded memory growth from a
   * malfunctioning registry returning oversized pages.
   */
  maxEntries?: number;
  /** Optional fetch implementation for testing. */
  fetchApi?: typeof fetch;
}

/**
 * Parse the servers list endpoint into a URL.
 *
 * @internal
 */
export function parseServersEndpointUrl(
  baseUrl: string,
  apiVersion: string,
): URL {
  const endpoint = buildServersEndpoint(baseUrl, apiVersion);
  try {
    return new URL(endpoint);
  } catch (err) {
    throw new McpRegistryClientError(
      `Invalid MCP Registry endpoint URL "${endpoint}": ${err}`,
    );
  }
}

/**
 * Build a page request URL with optional cursor and page-size params.
 *
 * @internal
 */
export function buildPageRequestUrl(
  endpoint: URL,
  cursor?: string,
  pageSize?: number,
): URL {
  const url = new URL(endpoint.toString());
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  if (pageSize !== undefined) {
    url.searchParams.set('limit', String(pageSize));
  }
  return url;
}

/**
 * Truncate an error response body for safe inclusion in log/error text.
 *
 * @internal
 */
export function truncateErrorBody(
  rawBody: string,
  maxLength = MAX_ERROR_BODY_LENGTH,
): string {
  if (rawBody.length <= maxLength) {
    return rawBody;
  }
  return `${rawBody.substring(0, maxLength)}…(truncated)`;
}

/**
 * Fetch and validate one registry list page.
 *
 * @internal
 */
export async function fetchRegistryPage(
  doFetch: typeof fetch,
  url: URL,
): Promise<McpRegistryListResponse> {
  const requestUrl = url.toString();

  let response: Response;
  try {
    response = await doFetch(requestUrl);
  } catch (err) {
    throw new McpRegistryClientError(
      `Failed to reach MCP Registry at ${requestUrl}: ${err}`,
    );
  }

  if (!response.ok) {
    const rawBody = await response.text().catch(() => '(no body)');
    throw new McpRegistryClientError(
      `MCP Registry returned HTTP ${response.status} for ` +
        `${requestUrl}: ${truncateErrorBody(rawBody)}`,
    );
  }

  let body: McpRegistryListResponse;
  try {
    body = (await response.json()) as McpRegistryListResponse;
  } catch (err) {
    throw new McpRegistryClientError(
      `MCP Registry returned unparseable JSON from ${requestUrl}: ${err}`,
    );
  }

  if (!body.servers || !Array.isArray(body.servers)) {
    throw new McpRegistryClientError(
      `MCP Registry response missing "servers" array from ${requestUrl}`,
    );
  }

  return body;
}

/**
 * Resolve the next pagination cursor, or `undefined` when paging is done.
 * Enforces repeated-cursor and page-limit safeguards.
 *
 * @internal
 */
export function resolveNextCursor(
  nextCursor: string | null | undefined,
  seenCursors: Set<string>,
  pagesFetched: number,
  pageLimit: number,
): string | undefined {
  if (!nextCursor || nextCursor.length === 0) {
    return undefined;
  }

  if (seenCursors.has(nextCursor)) {
    throw new McpRegistryClientError(
      `MCP Registry returned a repeated cursor "${nextCursor}" ` +
        `during pagination. Aborting sync to prevent infinite loop.`,
    );
  }
  seenCursors.add(nextCursor);

  if (pagesFetched >= pageLimit) {
    throw new McpRegistryClientError(
      `MCP Registry pagination exceeded the configured page limit ` +
        `of ${pageLimit} pages per sync. The registry still has more ` +
        `pages (nextCursor present). Increase pageLimit to fetch ` +
        `more pages.`,
    );
  }

  return nextCursor;
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
  const { baseUrl, apiVersion, pageLimit, pageSize, maxEntries, fetchApi } =
    options;
  const doFetch = fetchApi ?? fetch;
  const endpoint = parseServersEndpointUrl(baseUrl, apiVersion);

  const allServers: McpRegistryServerEntry[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let pagesFetched = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    const url = buildPageRequestUrl(endpoint, cursor, pageSize);
    const body = await fetchRegistryPage(doFetch, url);
    allServers.push(...body.servers);
    pagesFetched += 1;

    if (maxEntries !== undefined && allServers.length > maxEntries) {
      throw new McpRegistryClientError(
        `MCP Registry sync accumulated ${allServers.length} entries, ` +
          `exceeding the configured maxEntries cap of ${maxEntries}. ` +
          `Aborting sync to prevent unbounded memory growth. ` +
          `Increase maxEntries if the registry legitimately contains ` +
          `more servers.`,
      );
    }

    const nextCursor = resolveNextCursor(
      body.metadata?.nextCursor,
      seenCursors,
      pagesFetched,
      pageLimit,
    );
    if (!nextCursor) {
      hasMorePages = false;
      continue;
    }
    cursor = nextCursor;
  }

  return allServers;
}
