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

import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  coreServices,
  createServiceFactory,
  type SchedulerService,
} from '@backstage/backend-plugin-api';
import {
  mockCredentials,
  mockServices,
  ServiceFactoryTester,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
// eslint-disable-next-line @backstage/no-mixed-plugin-imports -- Integration test composes the public backend feature.
import connector from '@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend';
// eslint-disable-next-line @backstage/no-mixed-plugin-imports -- Integration test composes the public URL-reader service.
import readerService from '@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend';
import { SkillsCatalogProvider } from './SkillsCatalogProvider';
import { createDurableTestDatabase } from './testUtils';

// Only registry I/O is replaced: extraction, normalization, durable storage,
// authenticated connector HTTP, provider mapping/acknowledgment and MkDocs generation are real.
// The internal cross-package path intentionally replaces only registry I/O.
// If OciClient moves, update jest.mock, requireActual and requireMock together;
// Jest fails module resolution if the target is missing. This is a test boundary,
// not a public connector API or a promise that the internal path is stable.
jest.mock('../../skill-image-connector-backend/src/services/OciClient', () => ({
  ...jest.requireActual(
    '../../skill-image-connector-backend/src/services/OciClient',
  ),
  fetchManifest: jest.fn(),
  fetchBlob: jest.fn(),
}));
const registry = jest.requireMock(
  '../../skill-image-connector-backend/src/services/OciClient',
) as {
  fetchManifest: jest.Mock;
  fetchBlob: jest.Mock;
};
const sha = (value: string | Buffer) =>
  `sha256:${createHash('sha256').update(value).digest('hex')}`;
const markdown =
  '# Shared skill\n\nEquivalent documentation across all layouts.';
const card =
  'metadata:\n  name: integrated-skill\n  display-name: Integrated skill\n  description: Integration fixture\nspec:\n  prompt: Do things';
/** Minimal ustar fixture; no production archive code is mocked. */
function createTarArchive(files: Array<{ name: string; content: string }>) {
  const blocks: Buffer[] = [];
  for (const file of files) {
    const content = Buffer.from(file.content);
    const header = Buffer.alloc(512);
    header.write(file.name, 0, 100);
    header.write('0000644\0', 100);
    header.write(`${content.length.toString(8).padStart(11, '0')}\0`, 124);
    header[156] = 0x30;
    header.fill(0x20, 148, 156);
    const sum = header.reduce((a, b) => a + b, 0);
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
    blocks.push(
      header,
      content,
      Buffer.alloc((512 - (content.length % 512)) % 512),
    );
  }
  return Buffer.concat([...blocks, Buffer.alloc(1024)]);
}

function fixture(layout: 'annotated' | 'tar' | 'gzip', md = markdown) {
  const blobs = new Map<string, Buffer>();
  function descriptor(bytes: Buffer, mediaType: string, title?: string) {
    const digest = sha(bytes);
    blobs.set(digest, bytes);
    return {
      digest,
      size: bytes.length,
      mediaType,
      ...(title
        ? { annotations: { 'org.opencontainers.image.title': title } }
        : {}),
    };
  }
  const archive = createTarArchive([
    { name: 'skillimage.yaml', content: card },
    { name: 'SKILLS.md', content: md },
  ]);
  const layers =
    layout === 'annotated'
      ? [
          descriptor(Buffer.from(card), 'application/yaml', 'skillimage.yaml'),
          descriptor(Buffer.from(md), 'text/markdown', 'SKILLS.md'),
        ]
      : [
          descriptor(
            layout === 'gzip' ? gzipSync(archive) : archive,
            `application/vnd.oci.image.layer.v1.tar${
              layout === 'gzip' ? '+gzip' : ''
            }`,
          ),
        ];
  const manifest = {
    schemaVersion: 2 as const,
    config: {
      mediaType: 'application/vnd.oci.image.config.v1+json',
      digest: sha('config'),
      size: 0,
    },
    layers,
  };
  return { manifest, digest: sha(JSON.stringify(manifest)), blobs };
}

describe('OCI connector/provider/TechDocs reader integration', () => {
  it('renders equivalent real extraction layouts, shares alias documentation, and updates a moved tag', async () => {
    const workingDirectory = await mkdtemp(
      join(tmpdir(), 'skilldocs-integration-'),
    );
    const database = await createDurableTestDatabase();
    const annotated = fixture('annotated');
    const tar = fixture('tar');
    const gzip = fixture('gzip');
    const moved = fixture('annotated', '# Updated documentation');
    const fixtures = [annotated, tar, gzip, moved];
    expect(new Set(fixtures.map(f => f.digest)).size).toBe(4);
    const repositories = new Map([
      ['org/annotated', annotated],
      ['org/tar', tar],
      ['org/gzip', gzip],
      ['org/alias', annotated],
    ]);
    const digests = new Map(fixtures.map(f => [f.digest, f]));
    const blobs = new Map(fixtures.flatMap(f => [...f.blobs.entries()]));
    registry.fetchManifest.mockImplementation(
      async (ref: { repository: string; digest?: string }) => {
        const f = ref.digest
          ? digests.get(ref.digest)
          : repositories.get(ref.repository);
        if (!f) throw new Error('Unknown registry fixture');
        return { manifest: f.manifest, digest: f.digest };
      },
    );
    registry.fetchBlob.mockImplementation(
      async (_ref: unknown, digest: string) => {
        const blob = blobs.get(digest);
        if (!blob) throw new Error('Unknown blob');
        return blob;
      },
    );
    const tasks: Parameters<SchedulerService['scheduleTask']>[0][] = [];
    const scheduler = mockServices.scheduler.mock({
      scheduleTask: async task => {
        tasks.push(task);
      },
    });
    const providerConfig = {
      id: 'test',
      sources: [
        {
          connectorPluginId: 'skill-image-connector',
          sourceId: 'default',
          sourceType: 'oci' as const,
        },
      ],
      namespace: 'default',
      defaultOwner: 'team-skills',
      defaultLifecycle: 'production',
    };
    const configData = {
      backend: { workingDirectory },
      catalog: {
        providers: { skillsCatalogProvider: { test: providerConfig } },
      },
    };
    const backend = await startTestBackend({
      features: [
        connector,
        scheduler.factory,
        mockServices.rootConfig.factory({
          data: {
            ...configData,
            skillImageConnector: {
              allowedRegistries: ['quay.io'],
              maxRetries: 0,
              images: [...repositories.keys()].map(repository => ({
                imageRef: `quay.io/${repository}:v1`,
              })),
            },
          },
        }),
      ],
    });
    const connectorBase = `http://localhost:${
      (backend.server.address() as { port: number }).port
    }/api/skill-image-connector`;
    const own = mockCredentials.service('plugin:catalog');
    const auth = mockServices.auth.mock({
      getOwnServiceCredentials: async () => own,
      getPluginRequestToken: async ({ targetPluginId }) => ({
        token: mockCredentials.service.token({
          onBehalfOf: own,
          targetPluginId,
        }),
      }),
    });
    const discovery = mockServices.discovery.mock({
      getBaseUrl: async () => connectorBase,
    });
    const processed = new Map<string, Entity>();
    const { store } = await database.open();
    let poll!: () => Promise<void>;
    const provider = new SkillsCatalogProvider(
      providerConfig,
      discovery,
      auth,
      mockServices.logger.mock(),
      {
        run: async options => {
          poll = async () => {
            await options.fn(new AbortController().signal);
          };
        },
      },
      store,
      {
        getEntitiesByRefs: async ({ entityRefs }) => ({
          items: entityRefs.map(ref => processed.get(ref)),
        }),
      },
    );
    await provider.connect({
      refresh: async () => {},
      applyMutation: async mutation => {
        if (mutation.type !== 'delta') throw new Error('Expected delta');
        for (const entry of mutation.added)
          processed.set(stringifyEntityRef(entry.entity), entry.entity);
        for (const entry of mutation.removed)
          processed.delete(
            'entityRef' in entry
              ? entry.entityRef
              : stringifyEntityRef(entry.entity),
          );
      },
    });
    const tester = ServiceFactoryTester.from(readerService, {
      dependencies: [
        mockServices.rootConfig.factory({ data: configData }),
        createServiceFactory({
          service: coreServices.auth,
          deps: {},
          factory: async () => auth,
        }),
        createServiceFactory({
          service: coreServices.discovery,
          deps: {},
          factory: async () => discovery,
        }),
      ],
    });
    try {
      const [factory] = await tester.getSubject();
      const [{ reader, predicate }] = factory({
        config: mockServices.rootConfig({ data: configData }),
        logger: mockServices.logger.mock(),
        treeResponseFactory: {} as any,
      });
      await tasks[0].fn(new AbortController().signal);
      await poll();
      expect(processed.size).toBe(4);
      expect(
        await store.getPendingAcknowledgment('oci', 'default'),
      ).toBeUndefined();
      const initial = new Map(processed);
      const urls = [...processed.values()].map(entity =>
        entity.metadata.annotations!['backstage.io/techdocs-ref'].replace(
          /^url:/,
          '',
        ),
      );
      expect(new Set(urls).size).toBe(3);
      for (const url of urls) {
        expect(predicate(new URL(url))).toBe(true);
        const tree = await reader.readTree(url);
        const directory = await tree.dir();
        expect(await readFile(join(directory, 'docs/index.md'), 'utf8')).toBe(
          markdown,
        );
        expect(await readFile(join(directory, 'mkdocs.yml'), 'utf8')).toContain(
          'Skill Documentation',
        );
        await expect(
          reader.readUrl(url, { etag: tree.etag }),
        ).rejects.toMatchObject({ name: 'NotModifiedError' });
      }
      repositories.set('org/annotated', moved);
      await tasks[0].fn(new AbortController().signal);
      await poll();
      expect([...processed.keys()].sort()).toEqual([...initial.keys()].sort());
      const changed = [...processed.entries()].filter(
        ([ref, entity]) =>
          entity.metadata.annotations!['backstage.io/techdocs-ref'] !==
          initial.get(ref)!.metadata.annotations!['backstage.io/techdocs-ref'],
      );
      expect(changed).toHaveLength(1);
      const changedUrl = changed[0][1].metadata.annotations![
        'backstage.io/techdocs-ref'
      ].replace(/^url:/, '');
      expect(changedUrl).toContain(encodeURIComponent(moved.digest));
      expect(
        (await (await reader.readUrl(changedUrl)).buffer()).toString(),
      ).toBe('# Updated documentation');
      // The alias remains a distinct entity and keeps the old digest readable.
      expect(
        (
          await (
            await reader.readUrl(
              urls.find(url =>
                url.includes(encodeURIComponent(annotated.digest)),
              )!,
            )
          ).buffer()
        ).toString(),
      ).toBe(markdown);
    } finally {
      await backend.stop();
      await database.close();
      await rm(workingDirectory, { recursive: true, force: true });
    }
  });
});
