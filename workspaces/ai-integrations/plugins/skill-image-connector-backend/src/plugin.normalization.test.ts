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

import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { validateSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import request from 'supertest';
import { skillImageConnectorPlugin } from './plugin';
import { createTarArchive } from './testUtils';
import { normalizeSkillImageExtraction } from './services/normalizeExtraction';
import type { OciDescriptor } from './services/types';

// Mock DNS resolution so integration tests don't fail with real DNS lookups.
// By default, resolve all hostnames to a public IP.
jest.mock('node:dns', () => ({
  promises: {
    lookup: jest
      .fn()
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
  },
}));

// Observe the typed adapter result while exercising its real implementation.
jest.mock('./services/normalizeExtraction', () => {
  const actual = jest.requireActual<
    typeof import('./services/normalizeExtraction')
  >('./services/normalizeExtraction');
  return {
    ...actual,
    normalizeSkillImageExtraction: jest.fn(
      actual.normalizeSkillImageExtraction,
    ),
  };
});

const hash = (data: Buffer) =>
  `sha256:${createHash('sha256').update(data).digest('hex')}`;
const registry = 'https://registry.example.com/v2/org/skill';
type Layout = 'annotated' | 'tar' | 'gzip' | 'mixed-yaml' | 'mixed-md';
function fixture(
  layout: Layout,
  yamlName: string,
  mdName: string,
  name = 'Card Name',
) {
  const yaml = `metadata:\n  display-name: ${name}\n  name: internal-name\n  version: '1.0.0'\n  namespace: author-namespace\nkey: attacker-key\ndigest: attacker-digest\nsourceUri: attacker-uri\n`;
  const markdown =
    "---\nname: Markdown Name\nmetadata:\n  version: '1.0'\n  owner: team-demo\n---\n# Demo\n";
  const blobs = new Map<string, Buffer>();
  const layers: OciDescriptor[] = [];
  function layer(data: Buffer, title?: string, gzip = false) {
    const digest = hash(data);
    blobs.set(digest, data);
    layers.push({
      mediaType: gzip
        ? 'application/vnd.oci.image.layer.v1.tar+gzip'
        : 'application/vnd.oci.image.layer.v1.tar',
      digest,
      size: data.length,
      ...(title
        ? { annotations: { 'org.opencontainers.image.title': title } }
        : {}),
    });
  }
  if (layout === 'annotated') {
    layer(Buffer.from(yaml), yamlName);
    layer(Buffer.from(markdown), mdName);
  } else if (layout === 'mixed-yaml') {
    layer(Buffer.from(yaml), yamlName);
    layer(createTarArchive([{ name: mdName, content: markdown }]));
  } else if (layout === 'mixed-md') {
    layer(Buffer.from(markdown), mdName);
    layer(createTarArchive([{ name: yamlName, content: yaml }]));
  } else {
    const archive = createTarArchive([
      { name: `skills/${yamlName}`, content: yaml },
      { name: `skills/${mdName}`, content: markdown },
    ]);
    layer(
      layout === 'gzip' ? gzipSync(archive) : archive,
      undefined,
      layout === 'gzip',
    );
  }
  const manifest = Buffer.from(
    JSON.stringify({
      schemaVersion: 2,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: hash(Buffer.from('{}')),
        size: 2,
      },
      layers,
    }),
  );
  return { manifest, digest: hash(manifest), blobs, yaml, markdown };
}

describe('verified acquisition to normalization', () => {
  let workDir: string;
  let current: ReturnType<typeof fixture>;
  let requests: string[];
  const logger = mockServices.logger.mock();
  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'normalization-test-'));
    requests = [];
    logger.child.mockReturnValue(logger);
    jest.spyOn(global, 'fetch').mockImplementation(async input => {
      const url = String(input);
      requests.push(url);
      if (url.startsWith(`${registry}/manifests/`))
        return new Response(current.manifest);
      const digest = url.split('/blobs/')[1];
      const content = current.blobs.get(digest);
      if (!content) throw new Error(`Unexpected registry request: ${url}`);
      return new Response(content);
    });
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await rm(workDir, { recursive: true, force: true });
  });
  async function acquire(refs = ['registry.example.com/org/skill:v1']) {
    const backend = await startTestBackend({
      features: [
        skillImageConnectorPlugin,
        mockServices.rootLogger.factory(),
        logger.factory,
        mockServices.scheduler.factory({
          includeInitialDelayedTasksOnStartup: true,
        }),
        mockServices.rootConfig.factory({
          data: {
            app: { baseUrl: 'http://localhost:3000' },
            backend: {
              baseUrl: 'http://localhost:7007',
              workingDirectory: workDir,
            },
            skillImageConnector: {
              allowedRegistries: ['registry.example.com'],
              images: refs.map(imageRef => ({ imageRef })),
              maxRetries: 0,
            },
          },
        }),
      ],
    });
    try {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const response = await request(backend.server)
          .get('/api/skill-image-connector/images')
          .set('Authorization', mockCredentials.user.header());
        expect(response.status).toBe(200);
        if (response.body.status !== 'loading') return response.body;
        await delay(5);
      }
      throw new Error('Processing did not complete');
    } finally {
      await backend.stop();
    }
  }
  function records() {
    return jest
      .mocked(normalizeSkillImageExtraction)
      .mock.results.map(result => result.value.record);
  }
  const cases = (['annotated', 'tar', 'gzip'] as const).flatMap(layout =>
    ['skill.yaml', 'skillimage.yaml'].flatMap(yaml =>
      ['SKILL.md', 'SKILLS.md'].map(md => [layout, yaml, md] as const),
    ),
  );
  it.each(cases)('normalizes %s with %s and %s', async (layout, yaml, md) => {
    current = fixture(layout, yaml, md);
    const response = await acquire();
    expect(response).toEqual({
      status: 'ready',
      failedImages: [],
      images: [
        {
          imageRef: 'registry.example.com/org/skill:v1',
          skillImageYaml: current.yaml,
          skillsMd: current.markdown,
        },
      ],
    });
    const record = records()[0];
    expect(record).toEqual(
      expect.objectContaining({
        key: 'registry.example.com/org/skill:v1',
        name: 'Card Name',
        version: '1.0.0',
        digest: current.digest,
        sourceUri: `oci://registry.example.com/org/skill@${current.digest}`,
        owner: 'team-demo',
        extensions: { oci: { namespace: 'author-namespace' } },
      }),
    );
    expect(
      validateSnapshot({
        schemaVersion: '1',
        source: { id: 'test', type: 'oci' },
        status: 'ready',
        observedAt: '2026-10-13T00:00:00Z',
        skills: [record],
        failedSkillKeys: [],
      }).valid,
    ).toBe(true);
    expect(
      requests.filter(url => url === `${registry}/manifests/v1`),
    ).toHaveLength(1);
    expect(requests).toContain(`${registry}/manifests/${current.digest}`);
  });
  it.each(['mixed-yaml', 'mixed-md'] as const)(
    'normalizes a valid %s pair',
    async layout => {
      current = fixture(layout, 'skill.yaml', 'SKILL.md');
      expect((await acquire()).status).toBe('ready');
      expect(records()[0]?.name).toBe('Card Name');
    },
  );
  it('preserves case-sensitive same-digest aliases and identity across tag movement', async () => {
    const refs = ['v1', 'V1', 'latest'].map(
      tag => `registry.example.com/org/skill:${tag}`,
    );
    current = fixture('gzip', 'skill.yaml', 'SKILL.md');
    const originalDigest = current.digest;
    expect((await acquire(refs)).images).toHaveLength(3);
    expect(
      records()
        .map(record => record.key)
        .sort(),
    ).toEqual([...refs].sort());
    expect(new Set(records().map(record => record.digest))).toEqual(
      new Set([originalDigest]),
    );
    current = fixture('gzip', 'skill.yaml', 'SKILL.md', 'Moved Card');
    await acquire([refs[0]]);
    const moved = records().at(-1);
    expect(moved.key).toBe(refs[0]);
    expect(moved.digest).not.toBe(originalDigest);
    expect(moved.name).toBe('Moved Card');
  });
  it('preserves raw explicitly digest-addressed acquisition without an invented tag', async () => {
    current = fixture('tar', 'skill.yaml', 'SKILL.md');
    const imageRef = `registry.example.com/org/skill@${current.digest}`;
    expect((await acquire([imageRef])).images).toEqual([
      { imageRef, skillImageYaml: current.yaml, skillsMd: current.markdown },
    ]);
    expect(records()).toEqual([null]);
    expect(requests.filter(url => url.includes('/manifests/'))).toEqual([
      `${registry}/manifests/${current.digest}`,
    ]);
  });
});
