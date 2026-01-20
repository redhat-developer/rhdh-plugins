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

import { FILTER_ALL_VALUE } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Normalizes a filter value by converting "All" to undefined.
 *
 * @param value - The filter value ("All" or a specific value)
 * @returns The value if not "All", otherwise undefined
 */
export function normalizeFilter(value: string): string | undefined {
  return value === FILTER_ALL_VALUE ? undefined : value;
}
