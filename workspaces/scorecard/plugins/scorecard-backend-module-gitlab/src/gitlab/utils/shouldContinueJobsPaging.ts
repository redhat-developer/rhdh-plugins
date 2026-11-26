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

import type { GitlabJobItem } from '../types';
import { isTimestampInWindow } from './isTimestampInWindow';

function pageHasJobActivityInWindow(
  items: GitlabJobItem[],
  since: Date,
): boolean {
  return items.some(
    item =>
      isTimestampInWindow(item.started_at, since) ||
      isTimestampInWindow(item.finished_at, since),
  );
}

export function shouldContinueJobsPaging(
  items: GitlabJobItem[],
  since: Date,
): boolean {
  const oldestItem = items.at(-1);

  return !(
    oldestItem &&
    new Date(oldestItem.created_at) < since &&
    !pageHasJobActivityInWindow(items, since)
  );
}
