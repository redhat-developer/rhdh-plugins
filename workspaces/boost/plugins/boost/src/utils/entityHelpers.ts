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
  label: string;
  value: string;
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
      label: 'adoptionSkillCommand',
      value: `npx skills add ${entity.metadata.name}`,
    };
  }

  const remotes = (spec?.remotes ?? []) as Array<{
    url?: string;
    type?: string;
  }>;
  const ociAnnotation =
    entity.metadata.annotations?.['rhdh.io/ai-asset-source'];

  // 2. OCI-sourced
  const ociRemote = remotes.find(r => r.url?.startsWith('oci://'));
  if (ociRemote?.url) {
    return {
      type: 'copy',
      label: 'adoptionPullCommand',
      value: `podman pull ${ociRemote.url}`,
    };
  }
  if (ociAnnotation === 'oci') {
    // Annotation indicates OCI but no oci:// remote found — nothing to show
    return undefined;
  }

  // 3. Git-sourced
  const location = spec?.location as
    | { type?: string; target?: string }
    | undefined;
  if (location?.target) {
    const target = location.target;
    const isGitHost =
      target.includes('github.com') || target.includes('gitlab.com');
    if (isGitHost) {
      const archiveUrl = target.includes('github.com')
        ? `${target}/archive/refs/heads/main.zip`
        : target;
      return {
        type: 'link',
        label: 'adoptionDownloadZip',
        value: archiveUrl,
      };
    }
  }

  // 4. MCP servers
  if (specType === 'mcp-server' && remotes.length > 0 && remotes[0].url) {
    return {
      type: 'copy',
      label: 'adoptionMcpRemote',
      value: remotes[0].url,
    };
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
