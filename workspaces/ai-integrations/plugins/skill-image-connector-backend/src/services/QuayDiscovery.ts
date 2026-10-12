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
import type { QuayDiscoveryConfig, SkillImageOptions } from './types';
import {
  DEFAULT_SKILL_IMAGE_OPTIONS,
  MAX_DISCOVERY_PAGES,
  QUAY_TAG_PAGE_SIZE,
} from './types';
import {
  cancelResponseBody,
  fetchWithRedirects,
  HttpResponseError,
  readResponseJson,
  withRequestTimeout,
} from './HttpClient';
import { validateTag } from './OciClient';
import { withRetry } from './Retry';

/** Lightweight format check for names returned by the Quay repository API. */
const REPO_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function repositoryName(
  repo: unknown,
  organization: string,
  logger: LoggerService,
): string | undefined {
  if (
    !isObject(repo) ||
    typeof repo.name !== 'string' ||
    typeof repo.namespace !== 'string' ||
    !repo.name ||
    !repo.namespace
  ) {
    logger.warn(
      `Skipping repository with missing name or namespace in ${organization} discovery results`,
    );
    return undefined;
  }
  if (repo.namespace !== organization) {
    logger.warn(
      `Skipping repository ${repo.name}: namespace '${repo.namespace}' does not match organization '${organization}'`,
    );
    return undefined;
  }
  if (!REPO_NAME_PATTERN.test(repo.name)) {
    logger.warn(
      `Skipping repository with invalid name '${repo.name}' in ${organization} discovery results`,
    );
    return undefined;
  }
  return repo.name;
}

/**
 * Discovers public Quay repositories and returns distinct repository:tag
 * candidates. An explicit tag avoids tag-list requests; otherwise every active
 * tag is enumerated. Repository and tag pages share one logical-page budget.
 *
 * Results are sorted before the caller applies its candidate limit. Digests do
 * not determine identity: aliases remain separate candidates for inspection.
 */
export async function discoverQuayRepositories(
  config: QuayDiscoveryConfig,
  logger: LoggerService,
  signal?: AbortSignal,
  options: SkillImageOptions = DEFAULT_SKILL_IMAGE_OPTIONS,
): Promise<string[]> {
  const repositories = new Set<string>();
  const imageRefs = new Set<string>();
  let nextPage: string | undefined;
  const seenNextPages = new Set<string>();
  let pageCount = 0;
  let pageLimitReached = false;

  logger.info(
    `Starting Quay organization discovery for ${config.organization} on ${config.registry}`,
  );

  // Each logical page gets its own retry unit and a fresh timeout per attempt.
  // undefined denotes budget exhaustion; JSON responses cannot contain it.
  async function fetchPage(url: URL, context: string): Promise<unknown> {
    signal?.throwIfAborted();
    if (pageCount >= MAX_DISCOVERY_PAGES) {
      if (!pageLimitReached) {
        logger.warn(
          `Quay discovery for ${config.organization} reached the shared repository/tag page limit (${MAX_DISCOVERY_PAGES}); returning partial results`,
        );
      }
      pageLimitReached = true;
      return undefined;
    }
    pageCount++;
    logger.debug(`Fetching Quay discovery page ${pageCount}: ${url}`);
    return withRetry(
      () =>
        withRequestTimeout(
          async requestSignal => {
            const response = await fetchWithRedirects(
              url.toString(),
              { headers: { Accept: 'application/json' } },
              requestSignal,
            );
            if (!response.ok) {
              await cancelResponseBody(response);
              throw new HttpResponseError(
                `${context}: ${response.status} ${response.statusText}`,
                response.status,
              );
            }
            return readResponseJson(
              response,
              options.maxDiscoveryResponseSizeBytes,
            );
          },
          signal,
          options.fetchTimeoutMs,
        ),
      options,
      logger,
      context,
      signal,
    );
  }

  do {
    const url = new URL(`https://${config.registry}/api/v1/repository`);
    url.searchParams.set('namespace', config.organization);
    url.searchParams.set('public', 'true');
    if (nextPage) {
      url.searchParams.set('next_page', nextPage);
    }
    const body = await fetchPage(
      url,
      `Quay repository list request failed for organization ${config.organization}`,
    );
    if (body === undefined) {
      break;
    }
    if (!isObject(body) || !Array.isArray(body.repositories)) {
      throw new Error(
        `Quay repository list response for ${config.organization} did not contain a repositories array`,
      );
    }
    for (const repo of body.repositories) {
      const name = repositoryName(repo, config.organization, logger);
      if (name) {
        repositories.add(name);
      }
    }
    if (
      body.next_page !== undefined &&
      body.next_page !== null &&
      typeof body.next_page !== 'string'
    ) {
      throw new Error(
        `Invalid Quay repository pagination token for ${config.organization}`,
      );
    }
    nextPage = body.next_page || undefined;
    if (nextPage) {
      if (seenNextPages.has(nextPage)) {
        logger.warn(
          `Quay discovery for ${config.organization} detected a pagination cycle; stopping`,
        );
        break;
      }
      seenNextPages.add(nextPage);
    }
  } while (nextPage);

  for (const name of [...repositories].sort()) {
    signal?.throwIfAborted();
    const repository = `${config.organization}/${name}`;
    const imagePrefix = `${config.registry}/${repository}`;
    if (config.tag !== undefined) {
      imageRefs.add(`${imagePrefix}:${config.tag}`);
      continue;
    }
    if (pageLimitReached) {
      break;
    }
    const tags = new Set<string>();
    let tagPage = 1;
    let hasAdditional: boolean;
    do {
      const url = new URL(
        `https://${config.registry}/api/v1/repository/${encodeURIComponent(
          config.organization,
        )}/${encodeURIComponent(name)}/tag/`,
      );
      url.searchParams.set('onlyActiveTags', 'true');
      url.searchParams.set('page', String(tagPage));
      url.searchParams.set('limit', String(QUAY_TAG_PAGE_SIZE));
      const body = await fetchPage(
        url,
        `Quay tag list request failed for repository ${repository}`,
      );
      if (body === undefined) {
        break;
      }
      if (
        !isObject(body) ||
        !Array.isArray(body.tags) ||
        typeof body.has_additional !== 'boolean'
      ) {
        throw new Error(`Invalid Quay tag list response for ${repository}`);
      }
      const previousSize = tags.size;
      for (const tag of body.tags) {
        try {
          if (!isObject(tag) || typeof tag.name !== 'string') {
            throw new Error('Tag name must be a string');
          }
          validateTag(tag.name, imagePrefix);
          tags.add(tag.name);
          imageRefs.add(`${imagePrefix}:${tag.name}`);
        } catch {
          logger.warn(
            `Skipping invalid tag in ${repository} discovery results`,
          );
        }
      }
      hasAdditional = body.has_additional;
      if (hasAdditional && tags.size === previousSize) {
        logger.warn(
          `Quay discovery tag pagination made no progress for ${repository}; stopping with partial results`,
        );
        break;
      }
      tagPage++;
    } while (hasAdditional);
  }

  logger.info(
    `Quay discovery found ${repositories.size} repositories and ${imageRefs.size} tagged image candidates in ${config.organization} (${pageCount} pages)`,
  );

  // Validated repository and tag characters are ASCII, so default sorting also
  // supplies Unicode code-point ordering without locale-dependent collation.
  return [...imageRefs].sort();
}
