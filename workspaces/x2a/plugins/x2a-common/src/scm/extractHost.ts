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
 * @public
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

/**
 * Like {@link extractHost}, but only for plain HTTPS repository URLs that every
 * URL parser reads the same way. Use it where the host decides whether an
 * access token may be sent along.
 *
 * Returns `undefined` when the URL contains a backslash, whitespace or a
 * control character, uses a scheme other than `https`, carries credentials, or
 * has an authority that does not match the parsed host (for example a
 * percent-encoded or non-ASCII host). A URL without a scheme is treated as
 * HTTPS.
 *
 * @public
 */
export function extractAuthHost(repoUrl: string): string | undefined {
  const trimmed = repoUrl.trim();
  if (
    !trimmed ||
    /[\\\s]/.test(trimmed) ||
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return undefined;
  }
  const schemeEnd = trimmed.indexOf('://');
  if (
    schemeEnd !== -1 &&
    trimmed.slice(0, schemeEnd).toLocaleLowerCase('en-US') !== 'https'
  ) {
    return undefined;
  }
  const rest = schemeEnd === -1 ? trimmed : trimmed.slice(schemeEnd + 3);
  const authority = rest.split(/[/?#]/, 1)[0].toLocaleLowerCase('en-US');
  const host = extractHost(trimmed);
  if (!host || (authority !== host && authority !== `${host}:443`)) {
    return undefined;
  }
  return host;
}
