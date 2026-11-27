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
import {
  GITLAB_FETCH_ITEMS_LIMIT,
  GITLAB_MAX_PAGES,
  GITLAB_PAGE_SIZE,
} from '../gitlab/constants';
import type { ScanPagesOptions } from './types';

export async function scanPages<TItem, TResult>(
  logger: LoggerService,
  options: ScanPagesOptions<TItem, TResult>,
): Promise<TResult> {
  const {
    context,
    initialResult: result,
    fetchItemsLimit = GITLAB_FETCH_ITEMS_LIMIT,
    getValue,
    fetchPage,
    shouldContinue,
  } = options;

  let scanned = 0;

  const limitReached = () => {
    logger.warn(
      `Reached fetch limit while counting ${context} ` +
        `(fetchItemsLimit=${fetchItemsLimit}, maxPages=${GITLAB_MAX_PAGES}). ` +
        'Counts cannot be completed without scanning more candidates.',
    );

    return result;
  };

  for (
    let page = 1;
    page <= GITLAB_MAX_PAGES && scanned < fetchItemsLimit;
    page++
  ) {
    const items = await fetchPage(page, GITLAB_PAGE_SIZE);

    if (items.length === 0) {
      return result;
    }

    for (const item of items) {
      if (scanned >= fetchItemsLimit) {
        return limitReached();
      }

      scanned++;

      getValue(item, result);
    }

    const hasMore =
      items.length >= GITLAB_PAGE_SIZE &&
      (!shouldContinue || shouldContinue(items, GITLAB_PAGE_SIZE));

    if (!hasMore) {
      return result;
    }

    if (page === GITLAB_MAX_PAGES) {
      return limitReached();
    }
  }

  return result;
}
