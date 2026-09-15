/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */
import { createHash } from 'node:crypto';
import type {
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { buildSkillEntity } from '@red-hat-developer-hub/backstage-plugin-catalog-ai-skills-common';
import {
  EntityProvider,
  type EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

const MAX_ARTIFACT_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

type DiscoverySkill = {
  name: string;
  type: 'skill-md';
  description: string;
  url: string;
  digest: string;
};
type ProviderConfig = {
  id: string;
  discoveryUrl: string;
  owner: string;
  lifecycle: string;
  namespace: string;
};

function required(config: Config, key: string): string {
  const value = config.getOptionalString(key);
  if (!value)
    throw new Error(`catalog.providers.npxSkills entry requires '${key}'`);
  return value;
}

function versionFromSkill(contents: string, digest: string): string {
  const frontmatter = /^---\s*\n([\s\S]*?)\n---/.exec(contents)?.[1];
  const version = frontmatter?.match(
    /^version:\s*["']?([^\s"']+)["']?\s*$/m,
  )?.[1];
  if (
    version &&
    /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)
  )
    return version.replace(/^v/, '');
  return `0.0.0+${digest.replace(/^sha256:/, '').slice(0, 12)}`;
}

async function fetchText(url: URL): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
    });
    if (!response.ok) throw new Error(`GET ${url} returned ${response.status}`);
    if (response.type === 'opaqueredirect' || response.status >= 300)
      throw new Error(`Redirects are not permitted for ${url}`);
    const length = Number(response.headers.get('content-length') ?? '0');
    if (length > MAX_ARTIFACT_BYTES)
      throw new Error(`Artifact exceeds ${MAX_ARTIFACT_BYTES} byte limit`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_ARTIFACT_BYTES)
      throw new Error(`Artifact exceeds ${MAX_ARTIFACT_BYTES} byte limit`);
    return buffer.toString('utf8');
  } finally {
    clearTimeout(timer);
  }
}

/** Imports `skill-md` entries from a public npx-compatible discovery index. */
export class NpxSkillsEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private constructor(
    private readonly config: ProviderConfig,
    private readonly logger: LoggerService,
    private readonly taskRunner: SchedulerServiceTaskRunner,
  ) {}

  static fromConfig(
    config: Config,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
  ): NpxSkillsEntityProvider[] {
    const root = config.getOptionalConfig('catalog.providers.npxSkills');
    if (!root) return [];
    return root.keys().map((key) => {
      const entry = root.getConfig(key);
      const discoveryUrl = new URL(required(entry, 'discoveryUrl'));
      if (discoveryUrl.protocol !== 'https:')
        throw new Error(`npx skills discoveryUrl for '${key}' must use HTTPS`);
      return new NpxSkillsEntityProvider(
        {
          id: entry.getOptionalString('id') ?? key,
          discoveryUrl: discoveryUrl.toString(),
          owner:
            entry.getOptionalString('defaultOwner') ?? 'group:default/guests',
          lifecycle:
            entry.getOptionalString('defaultLifecycle') ?? 'experimental',
          namespace: entry.getOptionalString('catalogNamespace') ?? 'default',
        },
        logger.child({ target: `NpxSkillsEntityProvider:${key}` }),
        taskRunner,
      );
    });
  }

  getProviderName(): string {
    return `NpxSkillsEntityProvider:${this.config.id}`;
  }
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: `${this.getProviderName()}:run`,
      fn: async () => this.run(),
    });
  }

  async run(): Promise<void> {
    if (!this.connection) throw new Error('Not initialized');
    const indexUrl = new URL(this.config.discoveryUrl);
    const index = JSON.parse(await fetchText(indexUrl)) as { skills?: unknown };
    if (!Array.isArray(index.skills))
      throw new Error(`Discovery index at ${indexUrl} has no skills array`);
    const entities = [];
    for (const item of index.skills as DiscoverySkill[]) {
      if (
        !item ||
        item.type !== 'skill-md' ||
        typeof item.name !== 'string' ||
        typeof item.description !== 'string' ||
        typeof item.url !== 'string' ||
        !/^sha256:[a-f0-9]{64}$/i.test(item.digest)
      )
        continue;
      try {
        const artifactUrl = new URL(item.url);
        if (
          artifactUrl.protocol !== 'https:' ||
          artifactUrl.origin !== indexUrl.origin
        )
          throw new Error(
            'Artifact URL must be HTTPS and have the same origin as the discovery index',
          );
        const contents = await fetchText(artifactUrl);
        const digest = `sha256:${createHash('sha256').update(contents).digest('hex')}`;
        if (digest !== item.digest.toLowerCase())
          throw new Error(
            `Digest mismatch: expected ${item.digest}, received ${digest}`,
          );
        entities.push(
          buildSkillEntity({
            providerId: this.config.id,
            sourceIdentity: item.name,
            title: item.name,
            description: item.description,
            version: versionFromSkill(contents, digest),
            source: `npx-skills:${this.config.id}`,
            sourceLocation: `url:${artifactUrl}`,
            sourceReferenceKey: 'rhdh.io/npx-skill-ref',
            sourceReference: `${artifactUrl}#${digest}`,
            owner: this.config.owner,
            lifecycle: this.config.lifecycle,
            namespace: this.config.namespace,
          }),
        );
      } catch (error) {
        this.logger.warn(
          `Skipping npx skill '${item.name}': ${(error as Error).message}`,
        );
      }
    }
    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map((entity) => ({
        entity,
        locationKey: this.getProviderName(),
      })),
    });
    this.logger.info(`Synced ${entities.length} npx skills`);
  }
}
