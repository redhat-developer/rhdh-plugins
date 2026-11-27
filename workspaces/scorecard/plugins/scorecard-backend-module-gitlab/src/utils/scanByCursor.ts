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
import type { Cursor, ScanByCursorOptions } from './types';
import {
  GITLAB_FETCH_ITEMS_LIMIT,
  GITLAB_PAGE_SIZE,
} from '../gitlab/constants';

export async function scanByCursor<TItem, TResult>(
  logger: LoggerService,
  options: ScanByCursorOptions<TItem, TResult>,
): Promise<TResult> {
  const {
    context,
    initialResult: result,
    fetchItemsLimit = GITLAB_FETCH_ITEMS_LIMIT,
    getValue,
    fetchPage,
  } = options;

  let cursor: Cursor = null;
  let scanned = 0;

  const limitReached = () => {
    logger.warn(
      `Reached fetch limit while counting ${context} ` +
        `(fetchItemsLimit=${fetchItemsLimit}). ` +
        'Counts cannot be completed without scanning more candidates.',
    );

    return result;
  };

  while (scanned < fetchItemsLimit) {
    const page = await fetchPage(cursor, GITLAB_PAGE_SIZE);

    if (page.items.length === 0) {
      return result;
    }

    for (const item of page.items) {
      if (scanned >= fetchItemsLimit) {
        return limitReached();
      }

      scanned++;

      getValue(item, result);
    }

    if (!page.hasNextPage || !page.nextCursor) {
      return result;
    }

    cursor = page.nextCursor;
  }

  return limitReached();
}
