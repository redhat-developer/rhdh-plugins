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
 * Detects GraphQL schema / argument errors that mean this GitLab instance
 * does not support a field we need (for example MR `closedAfter` before 18.6).
 * Auth, network, and other runtime failures should not match.
 */
export function isGraphqlFeatureError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  const mentionsClosedAfter = normalized.includes('closedafter');
  const mentionsMergedAfter = normalized.includes('mergedafter');
  if (!mentionsClosedAfter && !mentionsMergedAfter) {
    return false;
  }

  return (
    normalized.includes('is not defined') ||
    normalized.includes("doesn't exist") ||
    normalized.includes('does not exist') ||
    normalized.includes('unknown argument') ||
    normalized.includes('unknown field') ||
    normalized.includes('undefined field') ||
    normalized.includes('undefined argument')
  );
}
