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

import type {
  CacheService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import { NotModifiedError } from '@backstage/errors';

/** TTL for cache entries: 1 hour in milliseconds */
const CACHE_TTL_MS = 60 * 60 * 1000;

type CacheEntry = {
  etag: string;
  foundPaths: string[];
};

export class FilecheckClient {
  private readonly urlReader: UrlReaderService;
  private readonly cache: CacheService;

  constructor(urlReader: UrlReaderService, cache: CacheService) {
    this.urlReader = urlReader;
    this.cache = cache;
  }

  /**
   * Downloads the entity's repository tree once and checks which of the given
   * file paths exist. Returns a map of path → boolean.
   *
   * A filter is applied so that only the requested paths are streamed from the
   * archive, keeping bandwidth usage proportional to the number of configured
   * files rather than the size of the whole repository.
   *
   * Results are cached per (target URL, file list) pair using ETags so that
   * subsequent scheduler runs skip re-downloading trees that have not changed.
   * Entries expire after one hour so stale data for removed entities is
   * eventually evicted.
   */
  async checkFiles(
    entity: Entity,
    filePaths: string[],
  ): Promise<Map<string, boolean>> {
    const { target } = getEntitySourceLocation(entity);

    const sortedPaths = [...filePaths].sort((a, b) => a.localeCompare(b));
    const cacheKey = `${target}\0${sortedPaths.join('\0')}`;
    const pathsSet = new Set(filePaths);
    const cached = await this.cache.get<CacheEntry>(cacheKey);

    let foundPaths: Set<string>;

    try {
      const tree = await this.urlReader.readTree(target, {
        etag: cached?.etag,
        filter: filePath => pathsSet.has(filePath),
      });

      const files = await tree.files();
      foundPaths = new Set(files.map(f => f.path));
      await this.cache.set(
        cacheKey,
        { etag: tree.etag, foundPaths: [...foundPaths] },
        { ttl: CACHE_TTL_MS },
      );
    } catch (error: any) {
      if (cached && error instanceof NotModifiedError) {
        foundPaths = new Set(cached.foundPaths);
      } else {
        throw error;
      }
    }

    const result = new Map<string, boolean>();
    for (const filePath of filePaths) {
      result.set(filePath, foundPaths.has(filePath));
    }
    return result;
  }
}
