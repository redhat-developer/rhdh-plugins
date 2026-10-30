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
import { createRouter } from './router';

describe('npx skill snapshots', () => {
  const snapshots = new Map<string, SkillSnapshot>();
  const app = express().use(createRouter(snapshots));

  beforeEach(() => snapshots.clear());

  it('returns 404 for an unknown source', async () => {
    const response = await request(app).get('/skills/missing').expect(404);
    expect(response.body).toEqual({ error: 'Unknown source' });
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
});
