/* Copyright Red Hat, Inc. Licensed under the Apache License, Version 2.0. */
import type {
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  type EntityProviderConnection,
  EntityProvider,
} from '@backstage/plugin-catalog-node';
import { buildSkillEntity } from '@red-hat-developer-hub/backstage-plugin-catalog-ai-skills-common';

type ProviderConfig = {
  id: string;
  registryUrl: URL;
  organization: string;
  tag: string;
  owner: string;
  lifecycle: string;
  namespace: string;
};
type QuayRepository = { name: string; namespace: string };
type Manifest = { annotations?: Record<string, string> };
const OCI_ACCEPT =
  'application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json';

async function fetchJson(
  url: URL,
  headers: Record<string, string> = {},
): Promise<Response> {
  const response = await fetch(url, { headers, redirect: 'manual' });
  if (!response.ok) throw new Error(`GET ${url} returned ${response.status}`);
  if (response.status >= 300)
    throw new Error(`Redirects are not permitted for ${url}`);
  return response;
}

/** Imports OCTO skillimage manifest metadata from public Quay namespaces. */
export class OciSkillsEntityProvider implements EntityProvider {
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
  ): OciSkillsEntityProvider[] {
    const root = config.getOptionalConfig('catalog.providers.ociSkills');
    if (!root) return [];
    return root.keys().map((key) => {
      const entry = root.getConfig(key);
      const registryUrl = new URL(entry.getString('registryUrl'));
      if (registryUrl.protocol !== 'https:')
        throw new Error(`OCI registryUrl for '${key}' must use HTTPS`);
      return new OciSkillsEntityProvider(
        {
          id: entry.getOptionalString('id') ?? key,
          registryUrl,
          organization: entry.getString('organization'),
          tag: entry.getOptionalString('tag') ?? 'latest',
          owner:
            entry.getOptionalString('defaultOwner') ?? 'group:default/guests',
          lifecycle:
            entry.getOptionalString('defaultLifecycle') ?? 'experimental',
          namespace: entry.getOptionalString('catalogNamespace') ?? 'default',
        },
        logger.child({ target: `OciSkillsEntityProvider:${key}` }),
        taskRunner,
      );
    });
  }

  getProviderName(): string {
    return `OciSkillsEntityProvider:${this.config.id}`;
  }
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: `${this.getProviderName()}:run`,
      fn: async () => this.run(),
    });
  }

  private async repositories(): Promise<QuayRepository[]> {
    const url = new URL('/api/v1/repository', this.config.registryUrl);
    url.searchParams.set('namespace', this.config.organization);
    url.searchParams.set('public', 'true');
    const body = (await (await fetchJson(url)).json()) as {
      repositories?: QuayRepository[];
    };
    return body.repositories ?? [];
  }

  async run(): Promise<void> {
    if (!this.connection) throw new Error('Not initialized');
    const entities = [];
    for (const repository of await this.repositories()) {
      const path = `${repository.namespace}/${repository.name}`;
      try {
        const tagUrl = new URL(
          `/v2/${path}/manifests/${this.config.tag}`,
          this.config.registryUrl,
        );
        const tagResponse = await fetchJson(tagUrl, { Accept: OCI_ACCEPT });
        const digest = tagResponse.headers.get('docker-content-digest');
        if (!digest)
          throw new Error(
            'Registry response did not provide Docker-Content-Digest',
          );
        const manifestUrl = new URL(
          `/v2/${path}/manifests/${digest}`,
          this.config.registryUrl,
        );
        const manifestResponse = await fetchJson(manifestUrl, {
          Accept: OCI_ACCEPT,
        });
        if (manifestResponse.headers.get('docker-content-digest') !== digest)
          throw new Error('Digest changed while fetching manifest');
        const manifest = (await manifestResponse.json()) as Manifest;
        const annotations = manifest.annotations ?? {};
        const status = annotations['io.skillimage.status'];
        if (!status) continue;
        const title =
          annotations['org.opencontainers.image.title'] ?? repository.name;
        const description =
          annotations['org.opencontainers.image.description'] ?? '';
        if (!description)
          throw new Error(
            'Skillimage manifest is missing a description annotation',
          );
        const ref = `${this.config.registryUrl.host}/${path}@${digest}`;
        const version =
          annotations['org.opencontainers.image.version'] ??
          `0.0.0+${digest.replace(/^sha256:/, '').slice(0, 12)}`;
        entities.push(
          buildSkillEntity({
            providerId: this.config.id,
            sourceIdentity: path,
            title,
            description,
            version,
            source: `oci-skills:${this.config.id}`,
            sourceLocation: `oci:${ref}`,
            sourceReferenceKey: 'rhdh.io/oci-skill-ref',
            sourceReference: ref,
            owner: this.config.owner,
            lifecycle: this.config.lifecycle,
            namespace: this.config.namespace,
          }),
        );
      } catch (error) {
        this.logger.warn(
          `Skipping OCI repository '${path}': ${(error as Error).message}`,
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
    this.logger.info(`Synced ${entities.length} OCI skills`);
  }
}
