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
 * Convert a glob pattern (e.g. "app-*", "*api*") to a RegExp.
 * Only supports `*` as a wildcard character.
 *
 * @public
 */
export const globToRegex = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regexStr}$`);
};

/**
 * Check if a name matches any of the given application patterns.
 * Supports exact matches and glob patterns with "*".
 *
 * @public
 */
export const matchesApplicationPattern = (
  name: string,
  patterns: string[],
): boolean => {
  return patterns.some(pattern =>
    pattern.includes('*') ? globToRegex(pattern).test(name) : pattern === name,
  );
};
