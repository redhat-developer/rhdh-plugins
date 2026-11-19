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

import { createLoadingSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import express from 'express';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { createRouter } from './router';
import { testSource } from './testUtils';
import { fetchSourceBuffer } from './services/fetchSource';

jest.mock('./services/fetchSource', () => ({ fetchSourceBuffer: jest.fn() }));

describe('npx skill snapshots', () => {
  const snapshots = new Map<string, SkillSnapshot>();
  const app = express().use(createRouter(snapshots, [testSource]));

  beforeEach(() => snapshots.clear());

  it('returns 404 for an unknown source', async () => {
    const response = await request(app).get('/skills/missing').expect(404);
    expect(response.body).toEqual({ error: 'Unknown source: missing' });
  });

  it('returns the configured source snapshot', async () => {
    const snapshot = createLoadingSnapshot({ id: 'rhess', type: 'npx' });
    snapshots.set('rhess', snapshot);

    const response = await request(app).get('/skills/rhess').expect(200);
    expect(response.body).toEqual(snapshot);
  });

  it('uses the decoded source ID as one path segment', async () => {
    const snapshot = createLoadingSnapshot({ id: 'source one', type: 'npx' });
    snapshots.set('source one', snapshot);

    const response = await request(app).get('/skills/source%20one').expect(200);
    expect(response.body).toEqual(snapshot);
  });

  it('serves the verified artifact with an ETag and rejects changed bytes or unknown revisions', async () => {
    const markdown = Buffer.from('# Example skill\n');
    const digest = `sha256:${createHash('sha256')
      .update(markdown)
      .digest('hex')}`;
    const sourceUri = 'https://skills.example.com/skill.md';
    snapshots.set(testSource.id, {
      ...createLoadingSnapshot({ id: testSource.id, type: 'npx' }),
      status: 'ready',
      skills: [{ key: 'example', name: 'example', digest, sourceUri }],
    });
    const route = `/skilldocs/${testSource.id}/${encodeURIComponent(digest)}`;
    const fetchArtifact = jest.mocked(fetchSourceBuffer);
    await request(app).get(`/skilldocs/other/${digest}`).expect(404);
    await request(app).get(`/skilldocs/${testSource.id}/unknown`).expect(404);
    expect(fetchArtifact).not.toHaveBeenCalled();
    fetchArtifact.mockResolvedValue(markdown);
    const response = await request(app).get(route).expect(200);
    expect(fetchArtifact).toHaveBeenCalledWith(
      sourceUri,
      testSource,
      'artifact',
    );
    expect(response.text).toBe(markdown.toString());
    expect(response.type).toBe('text/markdown');
    expect(response.headers.etag).toBe(`"${digest}"`);
    await request(app)
      .get(route)
      .set('If-None-Match', response.headers.etag)
      .expect(304);
    expect(fetchArtifact).toHaveBeenCalledTimes(1);
    fetchArtifact.mockResolvedValue(Buffer.from('# Changed'));
    await request(app).get(route).expect(409);
  });
});
