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
import { DEFAULT_SKILL_IMAGE_OPTIONS, MAX_DISCOVERY_PAGES } from './types';
import {
  cancelResponseBody,
  fetchWithRedirects,
  HttpResponseError,
  readResponseJson,
  withRequestTimeout,
} from './HttpClient';
import { withRetry } from './Retry';

/**
 * Lightweight format check for repository names returned by the Quay API.
 * OCI repository name components: [a-z0-9]+([._-][a-z0-9]+)*
 * Quay names are case-insensitive, so we accept uppercase too.
 */
const REPO_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * A single repository as returned by the Quay public repository list API.
 */
interface QuayRepository {
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
  options: SkillImageOptions = DEFAULT_SKILL_IMAGE_OPTIONS,
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

    const body = await withRetry(
      () =>
        withRequestTimeout(
          async requestSignal => {
            const response = await fetchWithRedirects(
              url.toString(),
              {
                headers: { Accept: 'application/json' },
              },
              requestSignal,
            );
            if (!response.ok) {
              await cancelResponseBody(response);
              throw new HttpResponseError(
                `Quay repository list request failed for organization ${config.organization}: ${response.status} ${response.statusText}`,
                response.status,
              );
            }
            const page = (await readResponseJson(
              response,
              options.maxDiscoveryResponseSizeBytes,
            )) as QuayRepositoryListPage | null;
            if (!page || !Array.isArray(page.repositories)) {
              throw new Error(
                `Quay repository list response for ${config.organization} did not contain a repositories array`,
              );
            }
            return page;
          },
          signal,
          options.fetchTimeoutMs,
        ),
      options,
      logger,
      `Quay repository page for ${config.organization}`,
      signal,
    );

    for (const repo of body.repositories) {
      if (!repo.name || !repo.namespace) {
        logger.warn(
          `Skipping repository with missing name or namespace in ${config.organization} discovery results`,
        );
        continue;
      }
      if (repo.namespace !== config.organization) {
        logger.warn(
          `Skipping repository ${repo.name}: namespace '${repo.namespace}' does not match organization '${config.organization}'`,
        );
        continue;
      }
      if (!REPO_NAME_PATTERN.test(repo.name)) {
        logger.warn(
          `Skipping repository with invalid name '${repo.name}' in ${config.organization} discovery results`,
        );
        continue;
      }
      const imageRef = `${config.registry}/${repo.namespace}/${repo.name}:${config.tag}`;
      imageRefs.push(imageRef);
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
  } while (nextPage);

  logger.info(
    `Quay discovery found ${imageRefs.length} repositories in ${config.organization} (${pageCount} pages)`,
  );

  return imageRefs;
}
