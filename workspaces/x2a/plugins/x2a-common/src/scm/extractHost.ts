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
 * Extracts the host (hostname + non-default port) from a repository URL.
 *
 * Accepts URLs with or without a scheme (`https://github.com/…` or `github.com/…`).
 * Returns `undefined` when the URL cannot be parsed.
 *
 * @internal
 */
export function extractHost(repoUrl: string): string | undefined {
  try {
    const trimmed = repoUrl.trim();
    const urlStr = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    // mind port as well
    return new URL(urlStr).host;
  } catch {
    return undefined;
  }
}
