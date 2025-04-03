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
import {
  EntityFilterQuery,
  GetEntitiesRequest,
  QueryEntitiesRequest,
} from '@backstage/catalog-client';

/**
 * @public
 */
export const decodeEntityFilter = (
  searchParameters: URLSearchParams,
): EntityFilterQuery | undefined => {
  if (!searchParameters.has('filter')) {
    return undefined;
  }

  const filter: Record<string, string | string[]> = {};

  searchParameters.getAll('filter').forEach(keyValuePair => {
    const firstEqualIndex = keyValuePair.indexOf('=');
    if (firstEqualIndex === -1) {
      return;
    }
    const name = keyValuePair.substring(0, firstEqualIndex);
    const value = keyValuePair.substring(firstEqualIndex + 1);

    const filterStringOrArray = filter[name];
    if (Array.isArray(filterStringOrArray)) {
      filterStringOrArray.push(value);
    } else if (filterStringOrArray) {
      filter[name] = [filterStringOrArray, value];
    } else {
      filter[name] = value;
    }
  });

  return filter;
};
/**
 * @public
 */
export const decodeGetEntitiesRequest = (
  searchParams: URLSearchParams,
): GetEntitiesRequest => {
  const request: QueryEntitiesRequest = {};

  if (searchParams.get('limit')) {
    request.limit = Number(searchParams.get('limit'));
  }
  request.filter = decodeEntityFilter(searchParams);

  return request;
};
