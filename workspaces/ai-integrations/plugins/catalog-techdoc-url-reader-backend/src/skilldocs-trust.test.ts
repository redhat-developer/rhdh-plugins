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
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { ConfigReader } from '@backstage/config';
import {
  mockServices,
  ServiceFactoryTester,
} from '@backstage/backend-test-utils';
import { ReadUrlResponseFactory } from '@backstage/backend-defaults/urlReader';
import {
  catalogTechdocUrlReaderPlugin,
  ModeCatalogBridgeTechdocUrlReader,
} from './plugin';

const digest = `sha256:${'a'.repeat(64)}`;
const pluginId = 'skill-image-connector';
const configData = {
  catalog: {
    providers: {
      skillsCatalogProvider: {
        test: {
          sources: [
            {
              connectorPluginId: pluginId,
              sourceId: 'quay-public',
              sourceType: 'oci',
            },
          ],
        },
      },
    },
  },
};
const logger = mockServices.logger.mock();
const base = 'https://rhdh.example/prefix/api/skill-image-connector';
const simpleBase = 'https://rhdh.example/api/skill-image-connector';
const urlFor = (b = base, source = 'quay-public') =>
  `${b}/skilldocs/${encodeURIComponent(source)}/${encodeURIComponent(digest)}`;
const readerFor = (b = base, data = configData) =>
  new ModeCatalogBridgeTechdocUrlReader(
    new ConfigReader(data),
    logger,
    new Map([[pluginId, b]]),
  );

describe('skill documentation destination trust', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn();
    ModeCatalogBridgeTechdocUrlReader.auth = mockServices.auth.mock({
      getPluginRequestToken: async () => ({ token: 'test-token' }),
      getOwnServiceCredentials: async () => ({} as any),
    });
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it.each([
    'https://evil.example',
    'http://rhdh.example',
    'https://rhdh.example:8443',
  ])('rejects untrusted origin %s before requesting a token', async origin => {
    const reader = readerFor(simpleBase);
    const url = urlFor(`${origin}/api/skill-image-connector`);
    expect(reader.bridgePredicate(new URL(url))).toBe(false);
    await expect(reader.readUrl(url)).rejects.toThrow('No matching config');
    expect(
      ModeCatalogBridgeTechdocUrlReader.auth.getPluginRequestToken,
    ).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not let legacy model-card matching bypass skill destination validation', async () => {
    const data = JSON.parse(JSON.stringify(configData));
    data.catalog.providers.skillsCatalogProvider.test.sources[0].sourceId =
      'modelcard';
    data.catalog.providers.modelCatalog = {
      [pluginId]: { cluster: { name: 'test' } },
    };
    const reader = readerFor(simpleBase, data);
    const url = urlFor(
      'https://evil.example/api/skill-image-connector',
      'modelcard',
    );
    expect(reader.bridgePredicate(new URL(url))).toBe(false);
    await expect(reader.readUrl(url)).rejects.toThrow('No matching config');
    expect(
      ModeCatalogBridgeTechdocUrlReader.auth.getPluginRequestToken,
    ).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('preserves the full discovered base and trims its trailing slash', () => {
    const reader = readerFor(`${base}/`);
    expect(reader.bridgePredicate(new URL(urlFor()))).toBe(true);
    expect(reader.bridgePredicate(new URL(urlFor(simpleBase)))).toBe(false);
    expect(reader.bridgePredicate(new URL(urlFor(`${base}-other`)))).toBe(
      false,
    );
  });

  it('fails closed without trusted bases', async () => {
    const reader = new ModeCatalogBridgeTechdocUrlReader(
      new ConfigReader(configData),
      logger,
    );
    expect(reader.bridgePredicate(new URL(urlFor(simpleBase)))).toBe(false);
    await expect(reader.readUrl(urlFor(simpleBase))).rejects.toThrow(
      'No matching config',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each(['%ZZ', '%', '%E0%A4%A'])(
    'rejects malformed encoding %s without throwing',
    segment => {
      const reader = readerFor(simpleBase);
      expect(
        reader.bridgePredicate(
          new URL(`${simpleBase}/skilldocs/${segment}/${digest}`),
        ),
      ).toBe(false);
    },
  );

  it('decodes each source segment once', () => {
    const data = JSON.parse(JSON.stringify(configData));
    data.catalog.providers.skillsCatalogProvider.test.sources[0].sourceId =
      'team/skills%2F';
    const reader = readerFor(base, data);
    expect(
      reader.bridgePredicate(new URL(urlFor(base, 'team/skills%2F'))),
    ).toBe(true);
    expect(reader.bridgePredicate(new URL(urlFor(base, 'team/skills/')))).toBe(
      false,
    );
  });

  it.each([undefined, '', '   '])(
    'rejects a successful response with invalid ETag %p',
    async etag => {
      const reader = readerFor(simpleBase);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(etag === undefined ? {} : { etag }),
      });
      jest.spyOn(ReadUrlResponseFactory, 'fromResponse').mockResolvedValue({
        buffer: async () => Buffer.from('# doc'),
        etag,
        stream: jest.fn(),
      });
      await expect(reader.readUrl(urlFor(simpleBase))).rejects.toThrow('ETag');
    },
  );

  it('reads Markdown from the complete trusted base using the real response adapter', async () => {
    const reader = readerFor();
    const etag = `"${digest}"`;
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response('# skill', { headers: { etag } }));
    const data = await reader.readUrl(urlFor(), { etag: 'previous' });
    expect(data.etag).toBe(etag);
    expect(await data.buffer()).toEqual(Buffer.from('# skill'));
    expect(global.fetch).toHaveBeenCalledWith(
      urlFor(),
      expect.objectContaining({
        redirect: 'error',
        headers: {
          Authorization: 'Bearer test-token',
          'If-None-Match': 'previous',
        },
      }),
    );
  });

  it('reports a missing real HTTP ETag before adapting or locking the body', async () => {
    const reader = readerFor(simpleBase);
    const response = new Response('# doc', { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(response);
    await expect(reader.readUrl(urlFor(simpleBase))).rejects.toThrow('ETag');
    expect(response.bodyUsed).toBe(true);
  });

  it('preserves the connector ETag without replacing it', async () => {
    const reader = readerFor(simpleBase);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ etag: `"${digest}"` }),
    });
    jest.spyOn(ReadUrlResponseFactory, 'fromResponse').mockResolvedValue({
      buffer: async () => Buffer.from('# doc'),
      etag: `"${digest}"`,
      stream: jest.fn(),
    });
    expect((await reader.readTree(urlFor(simpleBase))).etag).toBe(
      `"${digest}"`,
    );
  });

  it('rejects redirects on model-card requests too', async () => {
    const reader = new ModeCatalogBridgeTechdocUrlReader(
      new ConfigReader({
        catalog: {
          providers: {
            modelCatalog: {
              test: { cluster: { name: 'test' } },
            },
          },
        },
      }),
      logger,
    );
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    jest
      .spyOn(ReadUrlResponseFactory, 'fromResponse')
      .mockResolvedValue({ buffer: jest.fn(), stream: jest.fn() });
    await reader.readUrl('https://rhdh.example/modelcard/test');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://rhdh.example/modelcard/test',
      expect.objectContaining({ redirect: 'error' }),
    );
  });

  it('wires discovery into the synchronous reader predicate', async () => {
    const discovery = mockServices.discovery.mock({
      getBaseUrl: async () => `${base}/`,
    });
    const tester = ServiceFactoryTester.from(catalogTechdocUrlReaderPlugin, {
      dependencies: [
        mockServices.rootConfig.factory({ data: configData }),
        createServiceFactory({
          service: coreServices.discovery,
          deps: {},
          factory: async () => discovery,
        }),
      ],
    });
    const [factory] = await tester.getSubject();
    const [entry] = factory({
      config: mockServices.rootConfig({ data: configData }),
      logger,
      treeResponseFactory: {} as any,
    });
    expect(discovery.getBaseUrl).toHaveBeenCalledWith(pluginId);
    expect(entry.predicate(new URL(urlFor()))).toBe(true);
    expect(
      entry.predicate(
        new URL(urlFor('https://evil.example/api/skill-image-connector')),
      ),
    ).toBe(false);
  });
});
