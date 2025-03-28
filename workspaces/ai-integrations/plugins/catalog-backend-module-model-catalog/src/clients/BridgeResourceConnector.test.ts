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

import YAML from 'yaml';
import { Entity, ResourceEntity } from '@backstage/catalog-model';
import { Stream } from 'stream';

const fakeEntity: ResourceEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'Resource',
  metadata: {
    name: 'ibm-granite',
    description: 'IBM Granite code model',
    tags: [],
    links: [],
  },
  spec: {
    dependencyOf: [],
    owner: 'example-user',
    type: 'ai-model',
  },
};
const blob = new Blob([YAML.stringify(fakeEntity)], {
  type: 'application/json',
});

// Mock different fetch results based on the url passed in, to trigger success vs. error scenarios
global.fetch = jest.fn(url => {
  if (url === 'errorTest') {
    return Promise.resolve({
      ok: false,
      status: 401,
      json: () => 'error',
    });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    blob: () => Promise.resolve(blob),
  });
}) as jest.Mock;

import { fetchCatalogEntities } from './BridgeResourceConnector';

const httpsMock = require('https');

describe('Bridge Resource Connector', () => {
  it('should fetch catallog entities successfully', async () => {
    const streamStream = new Stream();
    httpsMock.get = jest.fn().mockImplementation(cb => {
      cb(streamStream);
      streamStream.emit('data', 'test');
      streamStream.emit('end');
    });
    const entities: Entity[] = await fetchCatalogEntities('fake-url');
    expect(entities.length).toEqual(1);
    expect(entities[0].metadata.name).toEqual('ibm-granite');
  });
  it('should error out if error encountered', async () => {
    const streamStream = new Stream();
    httpsMock.get = jest.fn().mockImplementation(cb => {
      cb(streamStream);
      streamStream.emit('data', 'test');
      streamStream.emit('end');
    });
    await expect(
      async () => await fetchCatalogEntities('errorTest'),
    ).rejects.toThrow();
  });
});
