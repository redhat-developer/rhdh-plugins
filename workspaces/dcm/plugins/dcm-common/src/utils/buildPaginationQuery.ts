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

import type { PaginationParams } from '../types/common';

/**
 * Builds a URL query string from pagination params.
 * Returns an empty string when no params are set.
 *
 * @public
 */
export function buildPaginationQuery(params: PaginationParams): string {
  const q = new URLSearchParams();
  if (params.max_page_size !== undefined)
    q.set('max_page_size', String(params.max_page_size));
  if (params.page_token) q.set('page_token', params.page_token);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}
