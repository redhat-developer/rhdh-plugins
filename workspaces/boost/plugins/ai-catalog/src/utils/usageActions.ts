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

import { getSpecRemotes } from './entityFields';

export type UsageAction =
  | {
      type: 'copy';
      value: string;
    }
  | {
      type: 'link';
      value: string;
      linkType: 'download' | 'source';
    };

type RecordValue = Record<string, unknown>;

const AI_ASSET_SOURCE_ANNOTATION = 'rhdh.io/ai-asset-source';
const OCI_SKILL_REF_ANNOTATION = 'rhdh.io/oci-skill-ref';
const NPX_SKILL_REGISTRY = 'rhdh.io/npx-skill-registry';
const NPX_SKILL_KEY = 'rhdh.io/npx-skill-key';
const OCI_REFERENCE_SCHEME = 'oci://';

function asRecord(value: unknown): RecordValue | undefined {
  return typeof value === 'object' && value !== null
    ? (value as RecordValue)
    : undefined;
}

function parseUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    return url.hostname ? url : undefined;
  } catch {
    return undefined;
  }
}

function isHttpUrl(value: string): boolean {
  const url = parseUrl(value);
  return url?.protocol === 'http:' || url?.protocol === 'https:';
}

function isSafeCommandToken(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value);
}

/** Build a command from registry metadata supplied by the npx connector. */
function getRegistryInstallAction(
  registry?: string,
  key?: string,
): UsageAction | undefined {
  if (
    !registry ||
    !key ||
    key.length > 64 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)
  )
    return undefined;
  const url = parseUrl(registry);
  if (
    url?.protocol !== 'https:' ||
    !registry.startsWith('https://') ||
    url.username ||
    url.password ||
    /[\s\\?#]/u.test(registry)
  )
    return undefined;

  // A registry path can contain shell metacharacters. Quote it as one
  // POSIX shell argument, including an embedded single quote.
  const base = url.pathname === '/' ? url.origin : url.href;
  const argument = `'${base.replace(/'/g, "'\\''")}'`;
  return { type: 'copy', value: `npx skills add ${argument} --skill ${key}` };
}

/**
 * Matches OCI references that are safe to interpolate into a `podman pull`
 * command. Shell metacharacters, whitespace, and empty references are not
 * accepted.
 */
const OCI_REFERENCE_PATTERN = /^oci:\/\/[a-zA-Z0-9][a-zA-Z0-9._:@/-]*$/;

function isSafeOciReference(value: string): boolean {
  return OCI_REFERENCE_PATTERN.test(value);
}

function getPathSegments(url: URL): string[] {
  return url.pathname.split('/').filter(Boolean);
}

function buildGitHubArchiveUrl(url: URL): string | undefined {
  const segments = getPathSegments(url);
  if (segments.length !== 2) return undefined;

  const [owner, repo] = segments;
  return `https://api.github.com/repos/${owner}/${repo.replace(
    /\.git$/,
    '',
  )}/zipball`;
}

function buildGitLabArchiveUrl(url: URL): string | undefined {
  const segments = getPathSegments(url);
  if (segments.length < 2 || segments.includes('-')) return undefined;

  const repo = segments.at(-1)?.replace(/\.git$/, '');
  if (!repo) return undefined;

  const projectPath = segments.slice(0, -1).concat(repo).join('/');
  return `${url.origin}/${projectPath}/-/archive/main/${repo}-main.zip`;
}

function getGitAction(target: string): UsageAction | undefined {
  if (!isHttpUrl(target)) return undefined;

  const url = parseUrl(target);
  if (!url) return undefined;

  if (url.hostname === 'github.com') {
    const archiveUrl = buildGitHubArchiveUrl(url);
    return archiveUrl
      ? { type: 'link', value: archiveUrl, linkType: 'download' }
      : { type: 'link', value: target, linkType: 'source' };
  }

  if (url.hostname === 'gitlab.com') {
    const archiveUrl = buildGitLabArchiveUrl(url);
    return archiveUrl
      ? { type: 'link', value: archiveUrl, linkType: 'download' }
      : { type: 'link', value: target, linkType: 'source' };
  }

  return { type: 'link', value: target, linkType: 'source' };
}

/**
 * Resolves the usage action for an entity.
 *
 * Skill source annotations select a Podman pull command for OCI images and an
 * npx command for other skills. Model servers and MCP servers expose their
 * HTTP(S) endpoint, OCI remotes use a Podman command, supported Git repository
 * roots use an archive download, and other valid Git sources use a source link.
 */
export function getUsageAction(entity: Entity): UsageAction | undefined {
  const spec = asRecord(entity.spec);
  const specType =
    typeof spec?.type === 'string' ? spec.type.toLowerCase() : undefined;

  if (specType === 'skill') {
    const sourceType =
      entity.metadata.annotations?.[AI_ASSET_SOURCE_ANNOTATION]?.split(
        '/',
      )[0]?.toLowerCase();

    if (sourceType === 'oci') {
      const ociSkillRef =
        entity.metadata.annotations?.[OCI_SKILL_REF_ANNOTATION]?.trim();

      if (!ociSkillRef || !isSafeOciReference(ociSkillRef)) return undefined;

      return {
        type: 'copy',
        value: `podman pull ${ociSkillRef.slice(OCI_REFERENCE_SCHEME.length)}`,
      };
    }

    if (sourceType === 'npx') {
      const registry = entity.metadata.annotations?.[NPX_SKILL_REGISTRY];
      const key = entity.metadata.annotations?.[NPX_SKILL_KEY];
      if (registry !== undefined || key !== undefined) {
        return getRegistryInstallAction(registry, key);
      }
    }

    if (isSafeCommandToken(entity.metadata.name)) {
      return {
        type: 'copy',
        value: `npx skills add ${entity.metadata.name}`,
      };
    }
  }

  if (specType === 'ai-model-server' && typeof spec?.serverUrl === 'string') {
    if (isHttpUrl(spec.serverUrl)) {
      return { type: 'copy', value: spec.serverUrl };
    }
  }

  const remotes = getSpecRemotes(entity);
  const ociRemote = remotes.find(remote => isSafeOciReference(remote.url));
  if (ociRemote) {
    return {
      type: 'copy',
      value: `podman pull ${ociRemote.url.slice(OCI_REFERENCE_SCHEME.length)}`,
    };
  }

  const location = asRecord(spec?.location);
  if (
    typeof location?.target === 'string' &&
    typeof location.type === 'string' &&
    location.type.toLowerCase() === 'git'
  ) {
    const gitAction = getGitAction(location.target);
    if (gitAction) return gitAction;
  }

  if (specType === 'mcp-server') {
    const mcpRemote =
      remotes.find(
        remote => remote.type === 'streamable-http' && isHttpUrl(remote.url),
      ) ?? remotes.find(remote => isHttpUrl(remote.url));

    if (mcpRemote) {
      return { type: 'copy', value: mcpRemote.url };
    }
  }

  return undefined;
}
