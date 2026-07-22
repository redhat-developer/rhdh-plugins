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

import type { Entity } from '@backstage/catalog-model';

import { getCategoryMeta } from './categoryMeta';

export function entityHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  const kind = entity.kind.toLowerCase();
  const name = entity.metadata.name;
  return `/catalog/${namespace}/${kind}/${name}`;
}

export function getSpecField(
  entity: Entity,
  field: string,
): string | undefined {
  return (entity.spec as Record<string, unknown> | undefined)?.[field] as
    | string
    | undefined;
}

export interface EntityFilters {
  search?: string;
  category?: string[];
  tags?: string[];
  owner?: string[];
  provider?: string[];
}

export function applyEntityFilters(
  items: Entity[],
  filters: EntityFilters,
): Entity[] {
  let results = items;

  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      e =>
        e.metadata.name.toLowerCase().includes(term) ||
        (e.metadata.title ?? '').toLowerCase().includes(term) ||
        (e.metadata.description ?? '').toLowerCase().includes(term) ||
        (e.metadata.tags ?? []).some(t => t.toLowerCase().includes(term)),
    );
  }

  if (filters.tags?.length) {
    const tagSet = new Set(filters.tags.map(t => t.toLowerCase()));
    results = results.filter(e =>
      (e.metadata.tags ?? []).some(t => tagSet.has(t.toLowerCase())),
    );
  }

  if (filters.category?.length) {
    const cats = new Set(filters.category.map(c => c.toLowerCase()));
    results = results.filter(e => {
      const specType = getSpecField(e, 'type');
      return specType !== undefined && cats.has(specType.toLowerCase());
    });
  }

  if (filters.provider?.length) {
    const providers = new Set(filters.provider.map(v => v.toLowerCase()));
    results = results.filter(e => {
      const src =
        e.metadata.annotations?.['rhdh.io/ai-asset-source']?.toLowerCase();
      return src !== undefined && providers.has(src);
    });
  }

  if (filters.owner?.length) {
    const owners = new Set(filters.owner.map(v => v.toLowerCase()));
    results = results.filter(e => {
      const o = getSpecField(e, 'owner');
      return o !== undefined && owners.has(o.toLowerCase());
    });
  }

  return results;
}

/**
 * Resolved adoption action for an AI asset entity.
 *
 * - `copy`: the value should be copied to the clipboard (skill, OCI pull, MCP remote URL).
 * - `link`: the value is a URL that should be opened in a new tab (git ZIP download).
 */
export interface AdoptionAction {
  type: 'copy' | 'link';
  value: string;
}

/**
 * Parses a URL string and returns its hostname, or undefined if the URL is malformed.
 */
function parseHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function isHost(hostname: string | undefined, host: string): boolean {
  return hostname === host || (hostname?.endsWith(`.${host}`) ?? false);
}

/**
 * Matches a well-formed `oci://` reference and rejects anything containing
 * shell metacharacters (`;`, `|`, `` ` ``, `$()`, spaces, etc.), since this
 * value is interpolated into a `podman pull` command that gets copied to the
 * clipboard.
 */
const OCI_REFERENCE_PATTERN = /^oci:\/\/[a-zA-Z0-9][a-zA-Z0-9._:@/-]*$/;

function isSafeOciReference(url: string): boolean {
  return OCI_REFERENCE_PATTERN.test(url);
}

/**
 * Returns true if `value` parses as an absolute `http:`/`https:` URL.
 */
function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Builds a "download ZIP" archive URL for a git-hosted repository target.
 *
 * - GitHub: uses the branch-agnostic `zipball` API endpoint, so the actual
 *   default branch is always resolved server-side (no branch guessing).
 *   Requires the target path to be exactly `owner/repo` (a repo root); a
 *   subpage such as `/tree/main` or `/blob/...` is not a repo root and is
 *   returned unchanged rather than guessing a wrong owner/repo pair.
 * - GitLab: has no branch-agnostic web URL, so this falls back to a
 *   best-effort `main` branch guess. This is a heuristic pending the
 *   backend download proxy (RHIDP-15167); it may not resolve for
 *   repositories whose default branch isn't `main`.
 */
function buildGitArchiveUrl(target: string, hostname: string): string {
  let segments: string[];
  try {
    segments = new URL(target).pathname
      .replace(/^\/|\/$/g, '')
      .split('/')
      .filter(Boolean);
  } catch {
    return target;
  }

  if (isHost(hostname, 'github.com')) {
    if (segments.length !== 2) return target;
    const [owner, repoRaw] = segments;
    return `https://api.github.com/repos/${owner}/${repoRaw.replace(/\.git$/, '')}/zipball`;
  }

  const repo = segments[segments.length - 1]?.replace(/\.git$/, '');
  if (!repo) return target;
  return `${target.replace(/\/$/, '')}/-/archive/main/${repo}-main.zip`;
}

/**
 * Resolves the adoption action for an entity based on its metadata.
 *
 * Priority order:
 * 1. Skills — `npx skills add <name>`
 * 2. OCI-sourced — `podman pull <oci-ref>`
 * 3. Git-sourced — Download ZIP link
 * 4. MCP servers — remote URL copy
 * 5. Fallback — undefined (no action)
 */
export function getAdoptionAction(entity: Entity): AdoptionAction | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const specType = getSpecField(entity, 'type');

  // 1. Skills
  if (specType === 'skill') {
    return {
      type: 'copy',
      value: `npx skills add ${entity.metadata.name}`,
    };
  }

  const remotes = (spec?.remotes ?? []) as Array<{
    url?: string;
    type?: string;
  }>;

  // 2. OCI-sourced
  // Checked before the mcp-server branch below: per #3735's priority order,
  // an oci:// remote takes precedence even for entities typed `mcp-server`.
  const ociRemote = remotes.find(r => r.url && isSafeOciReference(r.url));
  if (ociRemote?.url) {
    return {
      type: 'copy',
      value: `podman pull ${ociRemote.url}`,
    };
  }

  // 3. Git-sourced
  const location = spec?.location as
    | { type?: string; target?: string }
    | undefined;
  if (location?.target) {
    const target = location.target;
    const hostname = parseHostname(target);
    if (isHost(hostname, 'github.com') || isHost(hostname, 'gitlab.com')) {
      return {
        type: 'link',
        value: buildGitArchiveUrl(target, hostname as string),
      };
    }
  }

  // 4. MCP servers
  if (specType === 'mcp-server') {
    const mcpRemote =
      remotes.find(
        r => r.type === 'streamable-http' && r.url && isHttpUrl(r.url),
      ) ?? remotes.find(r => r.url && isHttpUrl(r.url));
    if (mcpRemote?.url) {
      return {
        type: 'copy',
        value: mcpRemote.url,
      };
    }
  }

  // 5. Fallback
  return undefined;
}

export function getSortValue(entity: Entity, columnId: string): string {
  switch (columnId) {
    case 'title':
      return entity.metadata.title ?? entity.metadata.name;
    case 'categoryLabel':
      return getCategoryMeta(getSpecField(entity, 'type')).label;
    case 'owner':
      return getSpecField(entity, 'owner') ?? '';
    case 'provider':
      return entity.metadata.annotations?.['rhdh.io/ai-asset-source'] ?? '';
    case 'description':
      return entity.metadata.description ?? '';
    default:
      return '';
  }
}
