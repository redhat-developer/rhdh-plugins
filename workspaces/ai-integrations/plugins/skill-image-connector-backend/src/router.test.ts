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

import type { LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import type { SkillImageExtraction } from './services/types';

const mockLogger: LoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

describe('createRouter', () => {
  let app: express.Express;
  let extractions: Map<string, SkillImageExtraction>;

  beforeAll(async () => {
    extractions = new Map();
    extractions.set('quay.io/org/repo:v1', {
      skillImageYamlPath: '/tmp/skill-image-xx/skillimage.yaml',
      skillsMdPath: '/tmp/skill-image-xx/SKILLS.md',
      skillImageYaml: 'name: test',
      skillsMd: '# Test',
    });
    const router = await createRouter(mockLogger, extractions);
    app = express();
    app.use(router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /images', () => {
    it('returns extracted image list', async () => {
      const res = await request(app).get('/images');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.failedImages).toEqual([]);
      expect(res.body.images).toHaveLength(1);
      expect(res.body.images[0]).toEqual({
        imageRef: 'quay.io/org/repo:v1',
        skillImageYaml: 'name: test',
        skillsMd: '# Test',
      });
    });

    it('reports loading while images are being processed', async () => {
      const router = await createRouter(
        mockLogger,
        new Map(),
        () => 'loading',
        () => ['quay.io/org/failed:v1'],
      );
      const loadingApp = express();
      loadingApp.use(router);

      const res = await request(loadingApp).get('/images');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'loading',
        failedImages: ['quay.io/org/failed:v1'],
        images: [],
      });
    });
  });
});
