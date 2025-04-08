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

import { Stream } from 'stream';
import {
  ModelCatalogKeys,
  fetchModelCatalogFromKey,
  fetchModelCatalogKeys,
} from './BridgeResourceConnector';

const fakeCatalogKeys: ModelCatalogKeys = {
  uris: ['example-model', 'model-two', 'model-three'],
};

const fakeCatalog: ModelCatalog = {
  models: [
    {
      name: 'ibm-granite',
      description: 'IBM Granite code model',
      lifecycle: 'production',
      owner: 'example-user',
    },
  ],
};

// Mock different fetch results based on the url passed in, to trigger success vs. error scenarios
global.fetch = jest.fn(url => {
  if (url === 'errorTest/list') {
    return Promise.resolve({
      ok: false,
      status: 401,
      json: () => 'error',
    });
  } else if (url === 'fake-url/example-model') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => fakeCatalog,
    });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => fakeCatalogKeys,
  });
}) as jest.Mock;

import { ModelCatalog } from '@redhat-ai-dev/model-catalog-types';

const httpsMock = require('https');

describe('fetchModelCatalogKeys', () => {
  it('should fetch catalog keys successfully', async () => {
    const streamStream = new Stream();
    httpsMock.get = jest.fn().mockImplementation(cb => {
      cb(streamStream);
      streamStream.emit('data', 'test');
      streamStream.emit('end');
    });
    const catalogKeys: string[] = await fetchModelCatalogKeys('fake-url');
    expect(catalogKeys.length).toEqual(3);
    expect(catalogKeys).toEqual(['example-model', 'model-two', 'model-three']);
  });
  it('should error out if error encountered', async () => {
    const streamStream = new Stream();
    httpsMock.get = jest.fn().mockImplementation(cb => {
      cb(streamStream);
      streamStream.emit('data', 'test');
      streamStream.emit('end');
    });
    await expect(
      async () => await fetchModelCatalogKeys('errorTest'),
    ).rejects.toThrow();
  });
});

describe('fetchModelCatalogFromKey', () => {
  it('should fetch catalog successfully', async () => {
    const streamStream = new Stream();
    httpsMock.get = jest.fn().mockImplementation(cb => {
      cb(streamStream);
      streamStream.emit('data', 'test');
      streamStream.emit('end');
    });
    const catalog: ModelCatalog = await fetchModelCatalogFromKey(
      'fake-url',
      '/example-model',
    );
    expect(catalog.models === undefined).toBe(false);
    expect(catalog.models.length).toEqual(1);
    expect(catalog.models[0].name).toEqual('ibm-granite');
  });
  it('should error out if error encountered', async () => {
    const streamStream = new Stream();
    httpsMock.get = jest.fn().mockImplementation(cb => {
      cb(streamStream);
      streamStream.emit('data', 'test');
      streamStream.emit('end');
    });
    await expect(
      async () => await fetchModelCatalogKeys('errorTest'),
    ).rejects.toThrow();
  });
});
