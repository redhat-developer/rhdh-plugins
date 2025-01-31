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

/**
 *
 * @public
 */
export const decodeFilterParams = (searchParams: URLSearchParams) => {
  const filter: Record<string, string[]> = {};

  searchParams.getAll('filter').forEach(param => {
    const [key, value] = param.split('=').map(decodeURIComponent);
    if (!filter[key]) {
      filter[key] = [];
    }
    filter[key].push(value);
  });

  return filter;
};

/**
 * @public
 */
export const decodeFacetParams = (searchParams: URLSearchParams) => {
  return searchParams.getAll('facet').map(decodeURIComponent);
};

/**
 * @public
 */
export const decodeQueryParams = (queryString: string) => {
  const searchParams = new URLSearchParams(queryString);

  return {
    ...(searchParams.getAll('filter').length > 0
      ? { filter: decodeFilterParams(searchParams) }
      : {}),
    ...(searchParams.getAll('facet').length > 0
      ? { facets: decodeFacetParams(searchParams) }
      : {}),
  };
};
