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
import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as tar from 'tar';
import {
  cleanupCatalogIndexTemp,
  extractCatalogIndex,
  extractCatalogIndexLayers,
  extractExtraCatalogIndex,
} from './catalog-index';
import { InstallException } from './errors';
import type { Skopeo } from './skopeo';
import { DPDY_FILENAME } from './types';

jest.mock('./log', () => ({ log: jest.fn() }));

type TarEntry = {
  path: string;
  body?: string;
  type?:
    | 'File'
    | 'SymbolicLink'
    | 'Link'
    | 'CharacterDevice'
    | 'FIFO'
    | 'GNUDumpDir';
  linkpath?: string;
};

/** Build a raw tar so entries can carry paths `tar.c` would sanitise. */
function rawTar(entries: TarEntry[]): Buffer {
  const blocks: Buffer[] = [];
  for (const e of entries) {
    const body = Buffer.from(e.body ?? '');
    const type = e.type ?? 'File';
    const header = new tar.Header({
      path: e.path,
      type,
      linkpath: e.linkpath,
      size: type === 'File' ? body.length : 0,
      mode: 0o644,
      mtime: new Date(0),
    });
    header.encode();
    blocks.push(header.block!);
    if (type === 'File' && body.length) {
      blocks.push(body, Buffer.alloc((512 - (body.length % 512)) % 512));
    }
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

type Layer = { digest?: string; blob?: Buffer | string };

/**
 * Stub skopeo whose `copy` materialises an OCI `dir:` layout: manifest.json
 * plus one blob per layer. `manifest` overrides the generated manifest text;
 * `null` omits manifest.json.
 */
function stubSkopeo(layers: Layer[], manifest?: string | null) {
  const copies: Array<{ src: string; dst: string }> = [];
  const skopeo = {
    copy: jest.fn(async (src: string, dst: string) => {
      copies.push({ src, dst });
      const dir = dst.replace(/^dir:/, '');
      await fs.mkdir(dir, { recursive: true });
      for (const layer of layers) {
        const fname = layer.digest?.split(':')[1];
        if (fname && layer.blob !== undefined) {
          await fs.writeFile(path.join(dir, fname), layer.blob);
        }
      }
      if (manifest === null) return;
      await fs.writeFile(
        path.join(dir, 'manifest.json'),
        manifest ??
          JSON.stringify({
            layers: layers.map(l => (l.digest ? { digest: l.digest } : {})),
          }),
      );
    }),
  };
  return { skopeo: skopeo as unknown as Skopeo, copies };
}

const IMAGE = 'quay.io/rhdh/plugin-catalog-index:1.10';

let work: string;

beforeEach(async () => {
  work = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-index-test-'));
});

afterEach(async () => {
  await fs.rm(work, { recursive: true, force: true });
});

describe('extractCatalogIndexLayers', () => {
  it.each([
    [IMAGE, `docker://${IMAGE}`],
    [`oci://${IMAGE}`, `docker://${IMAGE}`],
    [`docker://${IMAGE}`, `docker://${IMAGE}`],
  ])('pulls %s as %s', async (image, expected) => {
    const { skopeo, copies } = stubSkopeo([]);
    await extractCatalogIndexLayers(skopeo, image, work);
    expect(copies.map(c => c.src)).toEqual([expected]);
  });

  it('extracts every layer in order, later layers overwriting earlier ones', async () => {
    const { skopeo } = stubSkopeo([
      {
        digest: 'sha256:one',
        blob: rawTar([
          { path: 'a.txt', body: 'first' },
          { path: 'b.txt', body: 'only-in-one' },
        ]),
      },
      {
        digest: 'sha256:two',
        blob: rawTar([{ path: 'a.txt', body: 'second' }]),
      },
    ]);
    await extractCatalogIndexLayers(skopeo, IMAGE, work);
    await expect(fs.readFile(path.join(work, 'a.txt'), 'utf8')).resolves.toBe(
      'second',
    );
    await expect(fs.readFile(path.join(work, 'b.txt'), 'utf8')).resolves.toBe(
      'only-in-one',
    );
  });

  it.each([
    ['no digest', '{}'],
    ['a non-string digest', '{"digest":5}'],
    ['a digest without an algorithm', '{"digest":"nodigestseparator"}'],
    ['a non-object entry', 'null'],
  ])(
    'raises an InstallException for a layer entry with %s, before extracting any layer',
    async (_kind, entry) => {
      const { skopeo } = stubSkopeo(
        [
          {
            digest: 'sha256:good',
            blob: rawTar([{ path: 'ok.txt', body: 'ok' }]),
          },
        ],
        `{"layers":[{"digest":"sha256:good"},${entry}]}`,
      );
      const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
      await expect(extraction).rejects.toThrow(InstallException);
      await expect(extraction).rejects.toThrow(
        `Layer entry 1 in manifest.json of catalog index image ${IMAGE} has no usable digest`,
      );
      expect(await fs.readdir(work)).toEqual([]);
    },
  );

  it('resolves without writing anything when the manifest has no layers', async () => {
    const { skopeo } = stubSkopeo([], '{}');
    await extractCatalogIndexLayers(skopeo, IMAGE, work);
    expect(await fs.readdir(work)).toEqual([]);
  });

  // dst is dir:<workDir>/idx; the whole workDir must be gone.
  const downloadDirOf = (copies: Array<{ dst: string }>) =>
    path.dirname(copies[0]!.dst.replace(/^dir:/, ''));

  it('removes its download directory when extraction succeeds', async () => {
    const { skopeo, copies } = stubSkopeo([]);
    await extractCatalogIndexLayers(skopeo, IMAGE, work);
    expect(copies).toHaveLength(1);
    expect(existsSync(downloadDirOf(copies))).toBe(false);
  });

  it('removes its download directory when extraction fails', async () => {
    const { skopeo, copies } = stubSkopeo([], 'not json');
    await expect(
      extractCatalogIndexLayers(skopeo, IMAGE, work),
    ).rejects.toThrow(InstallException);
    expect(copies).toHaveLength(1);
    expect(existsSync(downloadDirOf(copies))).toBe(false);
  });

  it('raises an InstallException naming the image when manifest.json is missing', async () => {
    const { skopeo } = stubSkopeo([], null);
    const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
    await expect(extraction).rejects.toThrow(InstallException);
    await expect(extraction).rejects.toThrow(
      `manifest.json not found in catalog index image ${IMAGE}`,
    );
  });

  it('raises an InstallException naming the image when manifest.json is malformed', async () => {
    const { skopeo } = stubSkopeo([], '{not json');
    let parseError = '';
    try {
      JSON.parse('{not json');
    } catch (err) {
      parseError = (err as Error).message;
    }
    const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
    await expect(extraction).rejects.toThrow(InstallException);
    await expect(extraction).rejects.toThrow(
      `Malformed manifest.json in catalog index image ${IMAGE}: ${parseError}`,
    );
  });

  it.each(['null', '{"layers":"x"}'])(
    'raises an InstallException naming the image when manifest.json is %s',
    async manifest => {
      const { skopeo } = stubSkopeo([], manifest);
      const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
      await expect(extraction).rejects.toThrow(InstallException);
      await expect(extraction).rejects.toThrow(
        `Malformed manifest.json in catalog index image ${IMAGE}: expected an object with a layers array`,
      );
    },
  );

  it('refuses a layer digest that resolves outside the download directory', async () => {
    const { skopeo } = stubSkopeo(
      [],
      '{"layers":[{"digest":"sha256:../../x"}]}',
    );
    const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
    await expect(extraction).rejects.toThrow(InstallException);
    await expect(extraction).rejects.toThrow(
      `Layer digest sha256:../../x in catalog index image ${IMAGE} resolves outside the download directory`,
    );
  });

  it('raises an InstallException naming the image and digest when a layer blob is missing, before extracting any layer', async () => {
    const { skopeo } = stubSkopeo([
      { digest: 'sha256:good', blob: rawTar([{ path: 'ok.txt', body: 'ok' }]) },
      { digest: 'sha256:absent' },
    ]);
    const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
    await expect(extraction).rejects.toThrow(InstallException);
    await expect(extraction).rejects.toThrow(
      `Layer sha256:absent listed in manifest.json is missing from catalog index image ${IMAGE}`,
    );
    expect(await fs.readdir(work)).toEqual([]);
  });

  it.each([
    ['not a tar archive', Buffer.from('this is not a tar archive')],
    [
      'truncated',
      rawTar([{ path: 'a.txt', body: 'x'.repeat(2000) }]).subarray(0, 1200),
    ],
  ])(
    'raises an InstallException naming the image and digest when a layer is %s',
    async (_kind, blob) => {
      const { skopeo } = stubSkopeo([{ digest: 'sha256:corrupt', blob }]);
      const extraction = extractCatalogIndexLayers(skopeo, IMAGE, work);
      await expect(extraction).rejects.toThrow(InstallException);
      await expect(extraction).rejects.toThrow(
        `Failed to extract layer sha256:corrupt of catalog index image ${IMAGE}`,
      );
    },
  );

  it('drops entries that escape the destination and keeps the safe ones', async () => {
    const outside = path.join(work, 'outside');
    const dest = path.join(work, 'dest');
    await fs.mkdir(outside);
    await fs.mkdir(dest);
    const absolute = path.join(outside, 'absolute.txt');
    const { skopeo } = stubSkopeo([
      {
        digest: 'sha256:evil',
        blob: rawTar([
          { path: '../outside/traversal.txt', body: 'x' },
          { path: absolute, body: 'x' },
          { path: 'link-abs', type: 'SymbolicLink', linkpath: outside },
          { path: 'link-up', type: 'SymbolicLink', linkpath: '../outside' },
          { path: 'hard-up', type: 'Link', linkpath: '../outside/x' },
          { path: 'device', type: 'CharacterDevice' },
          { path: 'fifo', type: 'FIFO' },
          // node-tar would create this as a directory; the whitelist must not.
          { path: 'dumpdir', type: 'GNUDumpDir' },
          { path: 'safe.txt', body: 'safe' },
          { path: 'link-in', type: 'SymbolicLink', linkpath: 'safe.txt' },
        ]),
      },
    ]);
    await extractCatalogIndexLayers(skopeo, IMAGE, dest);
    expect(await fs.readdir(outside)).toEqual([]);
    expect((await fs.readdir(dest)).sort()).toEqual(['link-in', 'safe.txt']);
    await expect(fs.readlink(path.join(dest, 'link-in'))).resolves.toBe(
      'safe.txt',
    );
  });
});

describe('extractCatalogIndexLayers entry size cap', () => {
  const original = process.env.MAX_ENTRY_SIZE;
  afterEach(() => {
    if (original === undefined) delete process.env.MAX_ENTRY_SIZE;
    else process.env.MAX_ENTRY_SIZE = original;
  });

  it('raises an InstallException naming the entry and stops extracting', async () => {
    process.env.MAX_ENTRY_SIZE = '8';
    // MAX_ENTRY_SIZE is read at module load, so load a fresh copy.
    let mod!: typeof import('./catalog-index');
    jest.isolateModules(() => {
      mod = require('./catalog-index');
    });
    const { skopeo } = stubSkopeo([
      {
        digest: 'sha256:one',
        blob: rawTar([
          { path: 'small.txt', body: 'ok' },
          { path: 'big.bin', body: 'more than eight bytes' },
          { path: 'after.txt', body: 'ok' },
        ]),
      },
      { digest: 'sha256:two', blob: rawTar([{ path: 'two.txt', body: 'x' }]) },
    ]);
    const extraction = mod.extractCatalogIndexLayers(skopeo, IMAGE, work);
    await expect(extraction).rejects.toMatchObject({
      name: 'InstallException',
      message: 'Zip bomb detected in big.bin',
    });
    expect(await fs.readdir(work)).toEqual(['small.txt']);
  });
});

describe('extractCatalogIndex', () => {
  const dpdyLayer = (extra: TarEntry[] = []): Layer => ({
    digest: 'sha256:index',
    blob: rawTar([{ path: DPDY_FILENAME, body: 'plugins: []\n' }, ...extra]),
  });

  it('returns the extracted dynamic-plugins.default.yaml under <mountDir>/.catalog-index-temp', async () => {
    const { skopeo } = stubSkopeo([dpdyLayer()]);
    const entitiesDir = path.join(work, 'entities');
    const dpdy = await extractCatalogIndex(skopeo, IMAGE, work, entitiesDir);
    expect(dpdy).toBe(path.join(work, '.catalog-index-temp', DPDY_FILENAME));
    await expect(fs.readFile(dpdy, 'utf8')).resolves.toBe('plugins: []\n');
    expect(existsSync(entitiesDir)).toBe(false);
  });

  it('replaces <entitiesDir>/catalog-entities with extensions/, preferring it over marketplace/', async () => {
    const entitiesDir = path.join(work, 'entities');
    await fs.mkdir(path.join(entitiesDir, 'catalog-entities'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(entitiesDir, 'catalog-entities', 'stale.yaml'),
      'old',
    );
    const { skopeo } = stubSkopeo([
      dpdyLayer([
        { path: 'catalog-entities/extensions/nested/p.yaml', body: 'ext' },
        { path: 'catalog-entities/marketplace/m.yaml', body: 'mp' },
      ]),
    ]);
    await extractCatalogIndex(skopeo, IMAGE, work, entitiesDir);
    const dst = path.join(entitiesDir, 'catalog-entities');
    expect(await fs.readdir(dst)).toEqual(['nested']);
    await expect(
      fs.readFile(path.join(dst, 'nested', 'p.yaml'), 'utf8'),
    ).resolves.toBe('ext');
  });

  it('falls back to marketplace/ when extensions/ is absent', async () => {
    const entitiesDir = path.join(work, 'entities');
    const { skopeo } = stubSkopeo([
      dpdyLayer([{ path: 'catalog-entities/marketplace/m.yaml', body: 'mp' }]),
    ]);
    await extractCatalogIndex(skopeo, IMAGE, work, entitiesDir);
    await expect(
      fs.readFile(path.join(entitiesDir, 'catalog-entities', 'm.yaml'), 'utf8'),
    ).resolves.toBe('mp');
  });

  it('raises an InstallException naming the image when dynamic-plugins.default.yaml is missing', async () => {
    const { skopeo } = stubSkopeo([
      { digest: 'sha256:x', blob: rawTar([{ path: 'other.txt', body: 'x' }]) },
    ]);
    const extraction = extractCatalogIndex(skopeo, IMAGE, work, work);
    await expect(extraction).rejects.toThrow(InstallException);
    await expect(extraction).rejects.toThrow(
      `dynamic-plugins.default.yaml not found in ${IMAGE}`,
    );
  });
});

describe('extractExtraCatalogIndex', () => {
  it('refuses an absolute subdirectory before pulling anything', async () => {
    const { skopeo } = stubSkopeo([]);
    const extraction = extractExtraCatalogIndex(
      skopeo,
      IMAGE,
      '/etc',
      work,
      null,
    );
    await expect(extraction).rejects.toThrow(InstallException);
    await expect(extraction).rejects.toThrow(
      "Refusing to extract extra catalog index into unsafe subdirectory '/etc'",
    );
    expect(skopeo.copy).not.toHaveBeenCalled();
  });

  it('fails instead of warning when a layer blob is missing', async () => {
    const { skopeo } = stubSkopeo([{ digest: 'sha256:absent' }]);
    await expect(
      extractExtraCatalogIndex(skopeo, IMAGE, 'community', work, null),
    ).rejects.toThrow(
      `Layer sha256:absent listed in manifest.json is missing from catalog index image ${IMAGE}`,
    );
    expect(existsSync(path.join(work, 'community'))).toBe(false);
  });

  it('replaces content from a previous extraction into the same subdirectory', async () => {
    const stale = path.join(work, 'community', 'catalog-entities');
    await fs.mkdir(stale, { recursive: true });
    await fs.writeFile(path.join(stale, 'stale.yaml'), 'old');
    const { skopeo } = stubSkopeo([
      {
        digest: 'sha256:x',
        blob: rawTar([
          { path: 'catalog-entities/extensions/p.yaml', body: 'new' },
        ]),
      },
    ]);
    await extractExtraCatalogIndex(skopeo, IMAGE, 'community', work, null);
    expect(await fs.readdir(stale)).toEqual(['p.yaml']);
  });
});

describe('cleanupCatalogIndexTemp', () => {
  it('removes .catalog-index-temp and leaves sibling plugin dirs alone', async () => {
    await fs.mkdir(path.join(work, '.catalog-index-temp', 'nested'), {
      recursive: true,
    });
    await fs.mkdir(path.join(work, 'some-plugin'));
    await cleanupCatalogIndexTemp(work);
    expect(await fs.readdir(work)).toEqual(['some-plugin']);
  });

  it('is a no-op when there is nothing to clean', async () => {
    await expect(
      cleanupCatalogIndexTemp(path.join(work, 'does-not-exist')),
    ).resolves.toBeUndefined();
  });
});
