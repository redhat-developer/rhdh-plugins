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

import { SourceTechnology } from '../../client/src/schema/openapi';

/**
 * Aliases the agent may emit for each canonical {@link SourceTechnology}.
 * Keys are canonical enum values; values are lowercase aliases to recognize.
 * Add new entries here when a new source technology is supported.
 *
 * @public
 */
export const SOURCE_TECHNOLOGY_ALIASES: Record<SourceTechnology, string[]> = {
  chef: ['chef'],
  'legacy-ansible': ['legacy-ansible', 'ansible'],
  powershell: ['powershell', 'powershell-dsc', 'dsc'],
};

const ALIAS_TO_TECHNOLOGY = new Map<string, SourceTechnology>(
  Object.entries(SOURCE_TECHNOLOGY_ALIASES).flatMap(([tech, aliases]) =>
    aliases.map(alias => [alias, tech as SourceTechnology]),
  ),
);

/**
 * Normalizes the free-form technology string the x2a agent reports
 * into a validated {@link SourceTechnology} enum value.
 *
 * Returns `undefined` for `undefined`/empty input or unrecognized values.
 * Callers should log a warning when the return is `undefined` but the
 * input was non-empty.
 *
 * @public
 */
export function normalizeSourceTechnology(
  raw: string | undefined,
): SourceTechnology | undefined {
  if (!raw) return undefined;
  return ALIAS_TO_TECHNOLOGY.get(raw.trim().toLocaleLowerCase('en-US'));
}
