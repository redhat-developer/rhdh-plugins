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
import { FETCH_TIMEOUT_MS } from './types';

/** Maximum number of discovery pages to follow (design D7). */
const MAX_DISCOVERY_PAGES = 100;

/** Quay's default page size. The Quay API defaults to 100 repos per page. */
const QUAY_PAGE_SIZE = 100;

/**
 * A single repository as returned by the Quay public repository list API.
 */
export interface QuayRepository {
  namespace: string;
  name: string;
}

/**
 * The shape of a single page from the Quay
 * `GET /api/v1/repository?namespace=<org>` endpoint.
 */
interface QuayRepositoryListPage {
  repositories: QuayRepository[];
  next_page?: string;
}

/**
 * Configuration for Quay organization discovery.
 */
export interface QuayDiscoveryConfig {
  /** Quay registry host (e.g. "quay.io"). */
  registry: string;
  /** Public organization whose repositories will be discovered. */
  organization: string;
  /** Tag to select for each discovered repository. Defaults to "latest". */
  tag: string;
}

/**
 * Discovers all repositories in a public Quay organization by following
 * pagination. Returns the list of discovered image references as strings
 * in the form `registry/namespace/name:tag`.
 *
 * Enforces the D7 page limit to prevent unbounded work.
 */
export async function discoverQuayRepositories(
  config: QuayDiscoveryConfig,
  logger: LoggerService,
  signal?: AbortSignal,
): Promise<string[]> {
  const imageRefs: string[] = [];
  let nextPage: string | undefined;
  const seenNextPages = new Set<string>();
  let pageCount = 0;

  logger.info(
    `Starting Quay organization discovery for ${config.organization} on ${config.registry}`,
  );

  do {
    if (signal?.aborted) {
      throw new Error('Quay discovery was aborted');
    }

    pageCount++;
    if (pageCount > MAX_DISCOVERY_PAGES) {
      logger.warn(
        `Quay discovery for ${config.organization} reached the page limit (${MAX_DISCOVERY_PAGES}); returning partial results`,
      );
      break;
    }

    const url = new URL(`https://${config.registry}/api/v1/repository`);
    url.searchParams.set('namespace', config.organization);
    url.searchParams.set('public', 'true');
    if (nextPage) {
      url.searchParams.set('next_page', nextPage);
    }

    logger.debug(`Fetching Quay repository page ${pageCount}: ${url}`);

    const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const requestSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    const response = await fetch(url.toString(), {
      signal: requestSignal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Quay repository list request failed for organization ${config.organization}: ` +
          `${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as QuayRepositoryListPage;

    if (!Array.isArray(body.repositories)) {
      throw new Error(
        `Quay repository list response for ${config.organization} did not contain a repositories array`,
      );
    }

    for (const repo of body.repositories) {
      if (repo.namespace && repo.name) {
        const imageRef = `${config.registry}/${repo.namespace}/${repo.name}:${config.tag}`;
        imageRefs.push(imageRef);
      }
    }

    nextPage = body.next_page;

    // Detect pagination cycles (D7)
    if (nextPage) {
      if (seenNextPages.has(nextPage)) {
        logger.warn(
          `Quay discovery for ${config.organization} detected a pagination cycle; stopping`,
        );
        break;
      }
      seenNextPages.add(nextPage);
    }

    // If we received fewer repos than the page size, there are no more pages
    if (body.repositories.length < QUAY_PAGE_SIZE && !nextPage) {
      break;
    }
  } while (nextPage);

  logger.info(
    `Quay discovery found ${imageRefs.length} repositories in ${config.organization} (${pageCount} pages)`,
  );

  return imageRefs;
}
