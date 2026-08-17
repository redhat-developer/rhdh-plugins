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
import {
  getDiscoveryUris,
  getModelCatalog,
  getModelCard,
} from './services/InformerService';

jest.mock('./services/InformerService', () => ({
  getDiscoveryUris: jest.fn(),
  getModelCatalog: jest.fn(),
  getModelCard: jest.fn(),
}));

const mockedGetDiscoveryUris = getDiscoveryUris as jest.MockedFunction<
  typeof getDiscoveryUris
>;
const mockedGetModelCatalog = getModelCatalog as jest.MockedFunction<
  typeof getModelCatalog
>;
const mockedGetModelCard = getModelCard as jest.MockedFunction<
  typeof getModelCard
>;

const mockLogger: LoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter(mockLogger);
    app = express();
    app.use(router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /list', () => {
    it('returns discovery URIs', async () => {
      mockedGetDiscoveryUris.mockReturnValue({
        uris: ['/models/ns/model-a', '/models/ns/model-b'],
      });

      const res = await request(app).get('/list');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        uris: ['/models/ns/model-a', '/models/ns/model-b'],
      });
    });

    it('returns 500 when getDiscoveryUris throws', async () => {
      mockedGetDiscoveryUris.mockImplementation(() => {
        throw new Error('internal failure');
      });

      const res = await request(app).get('/list');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET /modelcard/:sourceId/*', () => {
    it('returns model card markdown', async () => {
      mockedGetModelCard.mockReturnValue('# Model Card\nSome content');

      const res = await request(app).get('/modelcard/source1/modelA');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/markdown/);
      expect(res.text).toBe('# Model Card\nSome content');
    });

    it('returns 404 when model card not found', async () => {
      mockedGetModelCard.mockReturnValue(undefined);

      const res = await request(app).get('/modelcard/source1/modelA');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not Found' });
    });

    it('returns 500 when getModelCard throws', async () => {
      mockedGetModelCard.mockImplementation(() => {
        throw new Error('internal failure');
      });

      const res = await request(app).get('/modelcard/source1/modelA');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET /models/:model/:version', () => {
    it('returns model catalog JSON', async () => {
      const catalog = {
        models: [{ name: 'test-model' }],
        modelServer: { name: 'test-server' },
      };
      mockedGetModelCatalog.mockReturnValue(catalog as any);

      const res = await request(app).get('/models/ns/model-name');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(catalog);
    });

    it('returns 404 when model catalog not found', async () => {
      mockedGetModelCatalog.mockReturnValue(undefined);

      const res = await request(app).get('/models/ns/model-name');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not Found' });
    });

    it('returns 500 when getModelCatalog throws', async () => {
      mockedGetModelCatalog.mockImplementation(() => {
        throw new Error('internal failure');
      });

      const res = await request(app).get('/models/ns/model-name');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });
});
