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

import type { McpServerDocument } from '@red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping';
import { formatErrorDetail, stripTrailingSlashes } from './util';

/** Max characters of an error response body included in client errors. */
const MAX_ERROR_BODY_LENGTH = 256;

/** Max redirect hops followed for a single page request. */
const MAX_REDIRECTS = 10;

/** HTTP statuses treated as redirects to follow manually. */
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

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
   * Maximum total entries buffered across the current registry
   * traversal (including prior resume syncs) before a full mutation.
   * When exceeded, paging stops gracefully: the tipping page is left
   * out (unless it is the only page), and `endCursor` is returned so
   * the provider can commit what was buffered and bound later
   * traversals.
   *
   * Counts `priorEntryCount` plus servers fetched in this call.
   */
  maxEntries?: number;
  /**
   * Entry count already accumulated earlier in the current multi-sync
   * traversal. Used with `maxEntries` so the cap spans resume cycles.
   */
  priorEntryCount?: number;
  /**
   * Cursor to resume from after a prior sync hit `pageLimit`. When
   * omitted, the first request starts at the beginning of the list.
   */
  startCursor?: string;
  /**
   * When set (after a prior `maxEntries` soft-stop), a traversal that
   * starts from the beginning stops when it would advance to this
   * cursor, instead of waiting for a missing `nextCursor`.
   */
  endCursor?: string;
  /**
   * Cursors already seen in the current multi-sync traversal. Shared
   * across resume cycles so repeated-cursor detection spans syncs.
   * Treated as read-only input; the updated set is returned on
   * {@link FetchServersResult.seenCursors}.
   */
  seenCursors?: ReadonlySet<string>;
  /**
   * Optional allowlist of permitted hostnames. When set, every
   * outbound request URL is validated against this list before
   * fetching, providing defense-in-depth against SSRF.
   */
  hostAllowList?: string[];
  /** Optional fetch implementation for testing. */
  fetchApi?: typeof fetch;
}

/**
 * Result of one `fetchRegistryServers` call (up to `pageLimit` pages).
 *
 * @internal
 */
export interface FetchServersResult {
  /** Servers fetched during this call. */
  servers: McpRegistryServerEntry[];
  /**
   * When set, more pages remain after this call stopped at `pageLimit`.
   * The next sync should pass this as `startCursor`.
   */
  resumeCursor?: string;
  /**
   * When set, this call stopped because `maxEntries` was exceeded.
   * The provider should commit a full mutation of the buffer and
   * remember this cursor as the end bound for later full traversals.
   */
  endCursor?: string;
  /**
   * Cursor set after this call, including any newly observed cursors.
   * Callers should replace their prior set with this value on success.
   */
  seenCursors: Set<string>;
}

/**
 * Outcome of resolving the registry's `nextCursor` for pagination.
 *
 * @internal
 */
export type ResolveNextCursorResult =
  | { status: 'complete' }
  | { status: 'continue'; cursor: string }
  | { status: 'pageLimitReached'; resumeCursor: string };

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
      `Invalid MCP Registry endpoint URL "${endpoint}": ${formatErrorDetail(
        err,
      )}`,
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
 * Whether an HTTP status code is a redirect this client follows.
 *
 * @internal
 */
export function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

/**
 * Resolve a redirect `Location` header against the current request URL.
 *
 * @internal
 */
export function resolveRedirectUrl(currentUrl: URL, location: string): URL {
  try {
    return new URL(location, currentUrl);
  } catch (err) {
    throw new McpRegistryClientError(
      `MCP Registry returned an invalid redirect Location "${location}" ` +
        `from ${currentUrl}: ${formatErrorDetail(err)}`,
    );
  }
}

/**
 * Validate a redirect target before following it.
 *
 * Requires http(s) and, when configured, an allowlisted hostname.
 *
 * @internal
 */
export function validateRedirectTarget(
  targetUrl: URL,
  hostAllowList?: string[],
): void {
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    throw new McpRegistryClientError(
      `MCP Registry redirect to disallowed protocol "${targetUrl.protocol}" ` +
        `in "${targetUrl}". Only http and https are permitted.`,
    );
  }
  assertRequestHostAllowed(targetUrl, hostAllowList);
}

/**
 * Fetch and validate one registry list page.
 *
 * Uses `redirect: 'manual'` and validates each `Location` header
 * against the host allowlist before following, so SSRF via redirect
 * cannot reach a disallowed host.
 *
 * @internal
 */
export async function fetchRegistryPage(
  doFetch: typeof fetch,
  url: URL,
  hostAllowList?: string[],
): Promise<McpRegistryListResponse> {
  let currentUrl = url;
  let redirectsFollowed = 0;
  let response = await fetchOnce(doFetch, currentUrl, hostAllowList);

  while (isRedirectStatus(response.status)) {
    if (redirectsFollowed >= MAX_REDIRECTS) {
      throw new McpRegistryClientError(
        `MCP Registry exceeded ${MAX_REDIRECTS} redirects starting from ` +
          `${url}. Last redirect was from ${currentUrl}.`,
      );
    }

    const location = response.headers.get('Location');
    if (!location) {
      throw new McpRegistryClientError(
        `MCP Registry returned HTTP ${response.status} without a ` +
          `Location header from ${currentUrl}.`,
      );
    }

    const nextUrl = resolveRedirectUrl(currentUrl, location);
    validateRedirectTarget(nextUrl, hostAllowList);
    redirectsFollowed += 1;
    currentUrl = nextUrl;
    response = await fetchOnce(doFetch, currentUrl, hostAllowList);
  }

  const requestUrl = currentUrl.toString();

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
      `MCP Registry returned unparseable JSON from ${requestUrl}: ${formatErrorDetail(
        err,
      )}`,
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
 * Perform one allowlist-checked fetch with `redirect: 'manual'`.
 *
 * @internal
 */
async function fetchOnce(
  doFetch: typeof fetch,
  url: URL,
  hostAllowList?: string[],
): Promise<Response> {
  const requestUrl = url.toString();
  assertRequestHostAllowed(url, hostAllowList);
  let response: Response;
  try {
    response = await doFetch(requestUrl, { redirect: 'manual' });
  } catch (err) {
    throw new McpRegistryClientError(
      `Failed to reach MCP Registry at ${requestUrl}: ${formatErrorDetail(
        err,
      )}`,
    );
  }
  assertResponseUrlAllowed(response, hostAllowList, requestUrl);
  return response;
}

/**
 * Resolve the next pagination cursor for this sync.
 *
 * Returns `complete` when paging is done, `continue` when another page
 * should be fetched in this sync, or `pageLimitReached` when this sync
 * should stop and resume from `resumeCursor` on a later sync.
 * Enforces repeated-cursor detection (still a hard error). Does not
 * mutate `seenCursors`; the caller records new cursors.
 *
 * @internal
 */
export function resolveNextCursor(
  nextCursor: string | null | undefined,
  seenCursors: ReadonlySet<string>,
  pagesFetched: number,
  pageLimit: number,
): ResolveNextCursorResult {
  if (!nextCursor || nextCursor.length === 0) {
    return { status: 'complete' };
  }

  if (seenCursors.has(nextCursor)) {
    throw new McpRegistryClientError(
      `MCP Registry returned a repeated cursor "${nextCursor}" ` +
        `during pagination. Aborting sync to prevent infinite loop.`,
    );
  }

  if (pagesFetched >= pageLimit) {
    return { status: 'pageLimitReached', resumeCursor: nextCursor };
  }

  return { status: 'continue', cursor: nextCursor };
}

/**
 * Runtime request guard: assert a URL's hostname is on the configured
 * allow list before issuing (or following) an outbound fetch.
 * Throws McpRegistryClientError when the hostname is not permitted.
 *
 * @internal
 */
export function assertRequestHostAllowed(
  url: URL,
  hostAllowList: string[] | undefined,
): void {
  if (!hostAllowList) {
    return;
  }
  const hostname = url.hostname.toLowerCase();
  if (!hostAllowList.includes(hostname)) {
    throw new McpRegistryClientError(
      `Request to hostname "${hostname}" blocked: not in the configured ` +
        `hostAllowList [${hostAllowList.join(', ')}].`,
    );
  }
}

/**
 * Fail closed when an allowlist is configured but the fetch response
 * does not expose a URL, then validate that URL's hostname.
 *
 * @internal
 */
export function assertResponseUrlAllowed(
  response: Response,
  hostAllowList: string[] | undefined,
  requestUrl: string,
): void {
  if (!hostAllowList) {
    return;
  }
  if (!response.url) {
    throw new McpRegistryClientError(
      `MCP Registry response for ${requestUrl} is missing response.url ` +
        `while hostAllowList is configured; refusing to proceed.`,
    );
  }
  assertRequestHostAllowed(new URL(response.url), hostAllowList);
}

/**
 * Soft-stop when a tipped page would push the traversal past `maxEntries`.
 *
 * Drops the tipping page unless it is the only content so far (then keeps
 * it and bounds later traversals at its next cursor).
 *
 * @internal
 */
export function applyMaxEntriesSoftStop(params: {
  serversIncludingTippedPage: McpRegistryServerEntry[];
  tippedPageSize: number;
  priorEntryCount: number;
  pageCursor: string | undefined;
  startCursor: string | undefined;
  tippedNextCursor: string | null | undefined;
}): { servers: McpRegistryServerEntry[]; endCursor: string | undefined } {
  const {
    serversIncludingTippedPage,
    tippedPageSize,
    priorEntryCount,
    pageCursor,
    startCursor,
    tippedNextCursor,
  } = params;

  const withoutTip = serversIncludingTippedPage.slice(
    0,
    serversIncludingTippedPage.length - tippedPageSize,
  );

  if (priorEntryCount + withoutTip.length === 0) {
    // Single page alone exceeds the cap — keep it so a mutation can
    // still proceed, and bound later traversals at its next cursor.
    return {
      servers: serversIncludingTippedPage,
      endCursor:
        typeof tippedNextCursor === 'string' && tippedNextCursor.length > 0
          ? tippedNextCursor
          : undefined,
    };
  }

  // Exclude the tipping page; end at the cursor used to fetch it.
  return {
    servers: withoutTip,
    endCursor: pageCursor ?? startCursor,
  };
}

/**
 * Record a resolved next-cursor decision into `seenCursors` and map it
 * to a pagination control action for the fetch loop.
 *
 * @internal
 */
export function advanceAfterResolvedCursor(
  next: ResolveNextCursorResult,
  seenCursors: Set<string>,
  endCursor: string | undefined,
):
  | { action: 'complete' }
  | { action: 'stopAtEnd' }
  | { action: 'resume'; resumeCursor: string }
  | { action: 'continue'; cursor: string } {
  if (next.status === 'complete') {
    return { action: 'complete' };
  }

  if (next.status === 'pageLimitReached') {
    seenCursors.add(next.resumeCursor);
    if (endCursor && next.resumeCursor === endCursor) {
      return { action: 'stopAtEnd' };
    }
    return { action: 'resume', resumeCursor: next.resumeCursor };
  }

  seenCursors.add(next.cursor);
  if (endCursor && next.cursor === endCursor) {
    return { action: 'stopAtEnd' };
  }
  return { action: 'continue', cursor: next.cursor };
}

/**
 * Whether paging should stop because the current cursor matches a
 * previously saved maxEntries end bound.
 *
 * @internal
 */
export function isAtEndCursor(
  cursor: string | undefined,
  endCursor: string | undefined,
): boolean {
  return endCursor !== undefined && cursor === endCursor;
}

/**
 * Fetch server entries from the MCP Registry using cursor pagination.
 *
 * Fetches at most `pageLimit` pages starting from `startCursor` (or the
 * beginning when unset). When more pages remain after the cap, returns
 * those pages' servers plus a `resumeCursor` for the next sync instead
 * of failing. When `maxEntries` would be exceeded, stops gracefully and
 * returns `endCursor` so the provider can commit the buffer. When
 * `endCursor` is supplied, paging stops upon reaching that cursor
 * instead of requiring a missing `nextCursor`.
 *
 * @throws McpRegistryClientError on transport, protocol, or
 *   repeated-cursor errors.
 */
export async function fetchRegistryServers(
  options: FetchServersOptions,
): Promise<FetchServersResult> {
  const {
    baseUrl,
    apiVersion,
    pageLimit,
    pageSize,
    maxEntries,
    priorEntryCount = 0,
    startCursor,
    endCursor,
    hostAllowList,
    fetchApi,
  } = options;
  const doFetch = fetchApi ?? fetch;
  const endpoint = parseServersEndpointUrl(baseUrl, apiVersion);
  // Own a local copy so the caller's options set is never mutated.
  const seenCursors = new Set(options.seenCursors);

  // Defense-in-depth: validate endpoint hostname at runtime even
  // though config parsing already checked baseUrl against the list.
  assertRequestHostAllowed(endpoint, hostAllowList);

  let allServers: McpRegistryServerEntry[] = [];
  let cursor: string | undefined = startCursor;
  let pagesFetched = 0;
  let resumeCursor: string | undefined;
  let maxEntriesEndCursor: string | undefined;

  while (!isAtEndCursor(cursor, endCursor)) {
    const url = buildPageRequestUrl(endpoint, cursor, pageSize);
    const body = await fetchRegistryPage(doFetch, url, hostAllowList);
    allServers.push(...body.servers);
    pagesFetched += 1;

    const totalEntries = priorEntryCount + allServers.length;
    if (maxEntries !== undefined && totalEntries > maxEntries) {
      const capped = applyMaxEntriesSoftStop({
        serversIncludingTippedPage: allServers,
        tippedPageSize: body.servers.length,
        priorEntryCount,
        pageCursor: cursor,
        startCursor,
        tippedNextCursor: body.metadata?.nextCursor,
      });
      allServers = capped.servers;
      maxEntriesEndCursor = capped.endCursor;
      break;
    }

    const advance = advanceAfterResolvedCursor(
      resolveNextCursor(
        body.metadata?.nextCursor,
        seenCursors,
        pagesFetched,
        pageLimit,
      ),
      seenCursors,
      endCursor,
    );

    if (advance.action === 'complete' || advance.action === 'stopAtEnd') {
      break;
    }
    if (advance.action === 'resume') {
      resumeCursor = advance.resumeCursor;
      break;
    }
    cursor = advance.cursor;
  }

  return {
    servers: allServers,
    resumeCursor,
    endCursor: maxEntriesEndCursor,
    seenCursors,
  };
}
