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

import gitUrlParse from 'git-url-parse';

export function getNestedValue<T>(obj: T, path: string): any {
  return path
    .split('.')
    .reduce(
      (acc, key) =>
        acc && (acc as Record<string, any>)[key]
          ? (acc as Record<string, any>)[key]
          : undefined,
      obj,
    );
}

export function extractLocationOwnerMap(locationUrls: string[]) {
  const locationGitOwnerMap = new Map<string, string>();
  for (const locationUrl of locationUrls) {
    const split = locationUrl.split('/blob/');
    if (split.length < 2) {
      continue;
    }
    locationGitOwnerMap.set(locationUrl, gitUrlParse(split[0]).owner);
  }
  return locationGitOwnerMap;
}

export function computeTotalCount<T>(
  data: T[],
  countList: number[],
  pageSize: number,
) {
  let totalCount = countList.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );
  if (totalCount < pageSize) {
    totalCount = data.length;
  }
  return totalCount;
}
