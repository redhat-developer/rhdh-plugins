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

import { mockServices } from '@backstage/backend-test-utils';
import {
  validOciRecordFull,
  validOciRecordMinimal,
  validNpxRecordFull,
  ociSource,
  npxSource,
  computeCatalogName,
  resolveVersion,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { consumeSnapshot } from './snapshot-consumer';
import type { SourceConsumerConfig } from './types';

const logger = mockServices.logger.mock();

const ociConsumer: SourceConsumerConfig = {
  connectorPluginId: 'skill-image-connector',
  sourceId: 'quay-public',
  sourceType: 'oci',
};

const npxConsumer: SourceConsumerConfig = {
  connectorPluginId: 'npx-skill-connector',
  sourceId: 'rhess-index',
  sourceType: 'npx',
};

function makeSnapshot(overrides: Partial<SkillSnapshot> = {}): SkillSnapshot {
  return {
    schemaVersion: '1',
    source: ociSource,
    status: 'ready',
    observedAt: '2025-01-15T10:00:00Z',
    skills: [validOciRecordFull],
    failedSkillKeys: [],
    ...overrides,
  };
}

// Mock global fetch
const originalFetch = global.fetch;
let mockFetch: jest.Mock;

beforeEach(() => {
  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  mockFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: () => Promise.resolve(bodyStr),
  });
}

describe('consumeSnapshot', () => {
  const baseUrl = 'http://localhost:7007/api/skill-image-connector';
  const token = 'test-token';
  const namespace = 'default';
  const defaultOwner = 'team-skills';
  const defaultLifecycle = 'production';

  it('maps a valid OCI ready snapshot to entities', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.status).toBe('ready');
    expect(result.observedAt).toBe('2025-01-15T10:00:00Z');

    const entity = result.entities[0].entity;
    expect(entity.kind).toBe('AiResource');
    expect(entity.apiVersion).toBe('backstage.io/v1alpha1');
    expect(entity.spec).toEqual({
      type: 'skill',
      owner: validOciRecordFull.owner,
      lifecycle: validOciRecordFull.lifecycle,
    });
    expect(entity.metadata.title).toBe(validOciRecordFull.name);
    expect(entity.metadata.namespace).toBe(namespace);
    expect(entity.metadata.annotations?.['rhdh.io/ai-asset-category']).toBe(
      'skill',
    );
    expect(entity.metadata.annotations?.['rhdh.io/ai-asset-source']).toBe(
      'oci/quay-public',
    );
    expect(entity.metadata.annotations?.['rhdh.io/oci-skill-ref']).toBe(
      validOciRecordFull.sourceUri,
    );

    // Entity name is deterministic
    const expectedName = computeCatalogName({
      type: 'oci',
      id: 'quay-public',
      key: validOciRecordFull.key,
    });
    expect(entity.metadata.name).toBe(expectedName);
  });

  it('uses configured defaults when record lacks owner/lifecycle', async () => {
    const snapshot = makeSnapshot({
      skills: [validOciRecordMinimal],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const entity = result.entities[0].entity;
    expect(entity.spec).toEqual({
      type: 'skill',
      owner: defaultOwner,
      lifecycle: defaultLifecycle,
    });
  });

  it('resolves version from declared version', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const version =
      result.entities[0].entity.metadata.annotations?.[
        'rhdh.io/ai-asset-version'
      ];
    const expectedVersion = resolveVersion(
      validOciRecordFull.version,
      validOciRecordFull.digest,
    );
    expect(version).toBe(expectedVersion);
  });

  it('resolves digest-based version when declared version is missing', async () => {
    const snapshot = makeSnapshot({
      skills: [validOciRecordMinimal],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const version =
      result.entities[0].entity.metadata.annotations?.[
        'rhdh.io/ai-asset-version'
      ];
    // Digest-based fallback
    expect(version).toMatch(/^0\.0\.0\+/);
  });

  it('handles npx source entities with npx-skill-ref annotation', async () => {
    const snapshot: SkillSnapshot = {
      schemaVersion: '1',
      source: npxSource,
      status: 'ready',
      observedAt: '2025-01-15T10:00:00Z',
      skills: [validNpxRecordFull],
      failedSkillKeys: [],
    };
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      'http://localhost:7007/api/npx-skill-connector',
      token,
      npxConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(1);

    const entity = result.entities[0].entity;
    const npxRef = entity.metadata.annotations?.['rhdh.io/npx-skill-ref'];
    expect(npxRef).toBe(
      `${validNpxRecordFull.sourceUri}#${validNpxRecordFull.digest}`,
    );
  });

  it('rejects snapshot with source ID mismatch', async () => {
    const snapshot = makeSnapshot({
      source: { id: 'wrong-source', type: 'oci' },
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Source ID mismatch/);
  });

  it('rejects snapshot with source type mismatch', async () => {
    const snapshot = makeSnapshot({
      source: { id: 'quay-public', type: 'npx' },
      skills: [],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Source type mismatch/);
  });

  it('rejects invalid snapshot (bad schema version)', async () => {
    const snapshot = {
      schemaVersion: '2',
      source: ociSource,
      status: 'ready',
      observedAt: '2025-01-15T10:00:00Z',
      skills: [],
      failedSkillKeys: [],
    };
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid snapshot/);
  });

  it('returns empty entities for loading status', async () => {
    const snapshot = makeSnapshot({
      status: 'loading',
      observedAt: null,
      skills: [],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(0);
    expect(result.status).toBe('loading');
  });

  it('returns empty entities for failed status', async () => {
    const snapshot = makeSnapshot({
      status: 'failed',
      observedAt: '2025-01-15T10:00:00Z',
      skills: [],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(0);
    expect(result.status).toBe('failed');
  });

  it('handles HTTP error from connector', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      text: () => Promise.resolve('Not Found'),
    });

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/404/);
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });

  it('handles malformed JSON response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve('not-json'),
    });

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Malformed JSON/);
  });

  it('maps multiple records with distinct identity-derived names', async () => {
    const snapshot = makeSnapshot({
      skills: [validOciRecordFull, validOciRecordMinimal],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(2);

    // Entity names are distinct
    const names = result.entities.map(e => e.entity.metadata.name);
    expect(new Set(names).size).toBe(2);

    // All names follow the deterministic pattern
    for (const name of names) {
      expect(name).toMatch(/^skill-[0-9a-f]{56}$/);
    }
  });

  it('reads streaming response body via readBoundedBody', async () => {
    const snapshot = makeSnapshot({ skills: [validOciRecordFull] });
    const bodyStr = JSON.stringify(snapshot);
    const encoder = new TextEncoder();
    const chunks = [encoder.encode(bodyStr)];

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: stream,
      text: () => Promise.reject(new Error('should not call text()')),
    });

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.status).toBe('ready');
  });

  it('rejects oversized streaming response via readBoundedBody', async () => {
    // Create a stream that produces more bytes than MAX_RESPONSE_BYTES
    const chunkSize = 1024 * 1024; // 1 MiB chunks
    const totalChunks = 6; // 6 MiB > 5 MiB limit
    let enqueued = 0;

    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (enqueued < totalChunks) {
          controller.enqueue(new Uint8Array(chunkSize));
          enqueued++;
        } else {
          controller.close();
        }
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      body: stream,
      text: () => Promise.reject(new Error('should not call text()')),
    });

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/exceeds.*byte limit/);
  });

  it('encodes sourceId as a single path segment in the request URL', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot);

    const sourceWithSpecialChars: SourceConsumerConfig = {
      ...ociConsumer,
      sourceId: 'source/with/slashes',
    };

    const result = await consumeSnapshot(
      baseUrl,
      token,
      sourceWithSpecialChars,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    // The fetch should have been called with encoded sourceId
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/skills/source%2Fwith%2Fslashes'),
      expect.any(Object),
    );

    // The result will fail due to source ID mismatch (the snapshot
    // still has the original sourceId), which is expected behavior
    expect(result.ok).toBe(false);
  });

  it('sets source-location and OCI reference annotations for OCI records', async () => {
    const snapshot = makeSnapshot({
      skills: [validOciRecordFull],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const entity = result.entities[0].entity;
    const annotations = entity.metadata.annotations!;

    expect(annotations['backstage.io/source-location']).toBe(
      `url:${validOciRecordFull.sourceUri}`,
    );
    expect(annotations['rhdh.io/oci-skill-ref']).toBe(
      validOciRecordFull.sourceUri,
    );
  });

  it('handles partial snapshot with valid records', async () => {
    const snapshot = makeSnapshot({
      status: 'partial',
      skills: [validOciRecordFull],
      failedSkillKeys: ['quay.io/some/failed:latest'],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.status).toBe('partial');
  });

  it('uses configured default owner when record owner is nonblank but invalid', async () => {
    const invalidOwnerRecord = {
      ...validOciRecordFull,
      owner: 'not a valid entity ref!!',
    };
    const snapshot = makeSnapshot({ skills: [invalidOwnerRecord] });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].entity.spec).toEqual(
      expect.objectContaining({ owner: defaultOwner }),
    );
  });

  it('uses configured default lifecycle when record lifecycle is nonblank but invalid', async () => {
    const invalidLifecycleRecord = {
      ...validOciRecordFull,
      lifecycle: 'has spaces and !!',
    };
    const snapshot = makeSnapshot({ skills: [invalidLifecycleRecord] });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].entity.spec).toEqual(
      expect.objectContaining({ lifecycle: defaultLifecycle }),
    );
  });

  it('accepts valid entity ref owner hints', async () => {
    const validOwnerRecord = {
      ...validOciRecordFull,
      owner: 'group:default/platform-team',
    };
    const snapshot = makeSnapshot({ skills: [validOwnerRecord] });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities[0].entity.spec).toEqual(
      expect.objectContaining({ owner: 'group:default/platform-team' }),
    );
  });

  it('rejects snapshot with invalid OCI source reference without mapping any records', async () => {
    const badRecord = {
      ...validOciRecordFull,
      sourceUri: 'not-an-oci-uri',
    };
    const snapshot = makeSnapshot({
      skills: [validOciRecordMinimal, badRecord],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.entities).toEqual([]);
    expect(result.error).toMatch(/Invalid source reference/);
  });

  it('rejects snapshot when OCI URI digest disagrees with record digest', async () => {
    const mismatchRecord = {
      ...validOciRecordFull,
      digest:
        'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    };
    const snapshot = makeSnapshot({ skills: [mismatchRecord] });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.entities).toEqual([]);
    expect(result.error).toMatch(/Invalid source reference/);
    expect(result.error).toMatch(/does not match/);
  });

  it('rejects snapshot with invalid npx source reference without mapping any records', async () => {
    const badNpxRecord = {
      ...validNpxRecordFull,
      sourceUri: 'http://insecure.example.com/skill.md',
    };
    const snapshot: SkillSnapshot = {
      schemaVersion: '1',
      source: npxSource,
      status: 'ready',
      observedAt: '2025-01-15T10:00:00Z',
      skills: [badNpxRecord],
      failedSkillKeys: [],
    };
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      'http://localhost:7007/api/npx-skill-connector',
      token,
      npxConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(false);
    expect(result.entities).toEqual([]);
    expect(result.error).toMatch(/Invalid source reference/);
  });

  it('does not produce entities when source reference validation fails on one of many records', async () => {
    const goodRecord = validOciRecordMinimal;
    const badRecord = {
      ...validOciRecordFull,
      sourceUri: 'invalid://not-oci',
    };
    const snapshot = makeSnapshot({
      skills: [goodRecord, badRecord],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    // Entire snapshot rejected — no entities mapped
    expect(result.ok).toBe(false);
    expect(result.entities).toEqual([]);
  });

  it('does not validate source references for loading/failed snapshots', async () => {
    // skills: [] is intentional here — the v1 schema invariant requires
    // loading/failed snapshots to have an empty skills array, so there
    // are no records for validateSourceReferences to check. The test
    // verifies the loading status early-return path produces ok:true
    // with no entities.
    const snapshot = makeSnapshot({
      status: 'loading',
      observedAt: null,
      skills: [],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(0);
    expect(result.status).toBe('loading');
  });

  // ─── Task 6.3: TechDocs annotation and revision ─────────────────

  it('sets backstage.io/techdocs-ref on OCI entities using discovery-based URL', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const entity = result.entities[0].entity;
    const techdocsRef =
      entity.metadata.annotations?.['backstage.io/techdocs-ref'];
    expect(techdocsRef).toBe(
      `url:${baseUrl}/skilldocs/${encodeURIComponent(
        ociConsumer.sourceId,
      )}/${encodeURIComponent(validOciRecordFull.digest)}`,
    );
  });

  it('does not set backstage.io/techdocs-ref on npx entities', async () => {
    const snapshot = makeSnapshot({
      source: npxSource,
      skills: [validNpxRecordFull],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      npxConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const entity = result.entities[0].entity;
    expect(
      entity.metadata.annotations?.['backstage.io/techdocs-ref'],
    ).toBeUndefined();
  });

  it('same-digest tag aliases share the same techdocs-ref URL', async () => {
    const alias = {
      ...validOciRecordFull,
      key: 'quay.io/octo/hello-world-skill:alias',
    };
    const snapshot = makeSnapshot({
      skills: [validOciRecordFull, alias],
    });
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.entities).toHaveLength(2);
    const url0 =
      result.entities[0].entity.metadata.annotations?.[
        'backstage.io/techdocs-ref'
      ];
    const url1 =
      result.entities[1].entity.metadata.annotations?.[
        'backstage.io/techdocs-ref'
      ];
    // Same digest → same URL
    expect(url0).toBe(url1);
    // Distinct entity identities
    expect(result.entities[0].catalogName).not.toBe(
      result.entities[1].catalogName,
    );
  });

  it('captures X-Skilldocs-Revision header from response', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot, 200, {
      'X-Skilldocs-Revision': '42',
    });

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.revision).toBe('42');
  });

  it('returns undefined revision when header is absent', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    expect(result.revision).toBeUndefined();
  });

  it('preserves identity and integrity annotations alongside techdocs-ref', async () => {
    const snapshot = makeSnapshot();
    mockFetchResponse(snapshot);

    const result = await consumeSnapshot(
      baseUrl,
      token,
      ociConsumer,
      namespace,
      defaultOwner,
      defaultLifecycle,
      logger,
    );

    expect(result.ok).toBe(true);
    const annotations = result.entities[0].entity.metadata.annotations!;
    // techdocs-ref is present
    expect(annotations['backstage.io/techdocs-ref']).toBeDefined();
    // Existing annotations are preserved
    expect(annotations['rhdh.io/oci-skill-ref']).toBe(
      validOciRecordFull.sourceUri,
    );
    expect(annotations['rhdh.io/ai-asset-category']).toBe('skill');
    expect(annotations['rhdh.io/ai-asset-version']).toBe(
      resolveVersion(validOciRecordFull.version, validOciRecordFull.digest),
    );
    expect(annotations['backstage.io/source-location']).toBeDefined();
  });
});
