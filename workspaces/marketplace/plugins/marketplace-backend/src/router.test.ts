/*
 * Copyright 2024 The Backstage Authors
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
import { mockErrorHandler, mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { createRouter } from './router';
import { MarketplaceService } from './services/MarketplaceService';

const mockPlugins: MarketplacePluginEntry[] = [
  {
    metadata: {
      name: 'plugin-a',
      title: 'Plugin A',
    },
  },
];

// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;
  let marketplaceService: jest.Mocked<MarketplaceService>;

  beforeEach(async () => {
    marketplaceService = {
      getPlugins: jest.fn(),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      marketplaceService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should return plugins', async () => {
    marketplaceService.getPlugins.mockResolvedValue(mockPlugins);

    const response = await request(app).get('/plugins');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockPlugins);
  });
});
