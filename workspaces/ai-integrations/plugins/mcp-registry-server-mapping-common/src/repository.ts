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

import type { McpServerRepository } from './types';
import { isAllowedUrl } from './urlPolicy';

/**
 * Result of computing the combined repository URL.
 *
 * @public
 */
export interface RepositoryUrlResult {
  /** The combined URL for Source Code link and source-location. */
  combinedUrl: string;
  /** The original repository.url, unnormalized (for dedicated annotation). */
  originalUrl: string;
}

/**
 * Normalize the repository base URL for combination:
 * - Remove trailing /
 * - Remove trailing .git suffix
 *
 * This normalization applies only to the combined URL, not to the
 * dedicated modelcontextprotocol.io/repository.url annotation.
 */
function normalizeBase(url: string): string {
  let base = url;

  // Remove trailing /
  while (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // Remove trailing .git
  if (base.endsWith('.git')) {
    base = base.slice(0, -4);
  }

  // Re-strip trailing / that may appear after .git removal
  while (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  return base;
}

/**
 * Normalize the subfolder path:
 * - Trim whitespace
 * - Remove leading and trailing /
 */
function normalizeSubfolder(subfolder: string): string {
  let s = subfolder.trim();
  while (s.startsWith('/')) {
    s = s.slice(1);
  }
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * Compute the combined repository URL per the SCM-aware algorithm.
 *
 * Returns undefined when repository.url fails D11
 * (see openspec/changes/mcp-registry-server-mapping/design.md § D11).
 *
 * @public
 */
export function computeRepositoryUrl(
  repository: McpServerRepository,
): RepositoryUrlResult | undefined {
  if (!isAllowedUrl(repository.url)) {
    return undefined;
  }

  const originalUrl = repository.url;
  const base = normalizeBase(originalUrl);

  // Check if subfolder is present and non-empty
  const subfolder =
    repository.subfolder !== undefined && repository.subfolder !== null
      ? normalizeSubfolder(repository.subfolder)
      : '';

  if (subfolder.length === 0) {
    // No subfolder — combined URL is the normalized base
    return { combinedUrl: base, originalUrl };
  }

  // Select browse-path template from repository.source (case-insensitive)
  const source = (repository.source ?? '').toLocaleLowerCase('en-US');

  let combinedUrl: string;
  switch (source) {
    case 'github':
      combinedUrl = `${base}/tree/HEAD/${subfolder}`;
      break;
    case 'gitlab':
      combinedUrl = `${base}/-/tree/HEAD/${subfolder}`;
      break;
    case 'bitbucket':
      combinedUrl = `${base}/src/HEAD/${subfolder}`;
      break;
    case 'azure-devops': {
      // Use query parameter; encode each path segment for safe query values
      const separator = base.includes('?') ? '&' : '?';
      const encodedSubfolder = subfolder
        .split('/')
        .map(encodeURIComponent)
        .join('/');
      combinedUrl = `${base}${separator}path=/${encodedSubfolder}`;
      break;
    }
    default:
      // Fallback: simple path join
      combinedUrl = `${base}/${subfolder}`;
      break;
  }

  return { combinedUrl, originalUrl };
}
