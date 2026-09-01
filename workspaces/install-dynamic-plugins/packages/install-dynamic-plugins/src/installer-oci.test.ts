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
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as tar from 'tar';
import { InstallException } from './errors';
import { OciImageCache } from './image-cache';
import { installOciPlugin } from './installer-oci';
import { Skopeo } from './skopeo';
import {
  CONFIG_HASH_FILE,
  IMAGE_HASH_FILE,
  type Plugin,
  PullPolicy,
} from './types';

const PLUGIN_PATH = 'my-plugin';
const CONFIG_HASH = 'config-hash-unchanged';

function ociPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    package: `oci://registry.io/org/plugin:latest!${PLUGIN_PATH}`,
    version: 'latest',
    plugin_hash: CONFIG_HASH,
    pullPolicy: PullPolicy.ALWAYS,
    pluginConfig: { dynamicPlugins: { frontend: {} } },
    ...overrides,
  };
}

/**
 * Fake `OciImageCache` recording every call. Faking at this seam (rather than
 * at `skopeo`) keeps the digest tests free of any registry interaction — the
 * behaviour under test is `isAlreadyInstalled`, not the download itself.
 */
function fakeImageCache(opts: { digest: string; tarball?: string }): {
  cache: OciImageCache;
  calls: { getTarball: string[]; getDigest: string[] };
} {
  const calls = { getTarball: [] as string[], getDigest: [] as string[] };
  const cache = {
    getTarball: async (image: string) => {
      calls.getTarball.push(image);
      if (!opts.tarball) {
        throw new Error(`unexpected getTarball(${image}) — no tarball staged`);
      }
      return opts.tarball;
    },
    getDigest: async (image: string) => {
      calls.getDigest.push(image);
      return opts.digest;
    },
  } as unknown as OciImageCache;
  return { cache, calls };
}

/** Pack `<PLUGIN_PATH>/package.json` into a layer tarball `extractOciPlugin` can read. */
async function makeLayerTarball(dir: string, body: string): Promise<string> {
  const stage = mkdtempSync(join(tmpdir(), 'oci-layer-stage-'));
  mkdirSync(join(stage, PLUGIN_PATH), { recursive: true });
  writeFileSync(join(stage, PLUGIN_PATH, 'package.json'), body);
  const tarPath = join(dir, 'layer.tar');
  await tar.c({ gzip: false, file: tarPath, cwd: stage }, [PLUGIN_PATH]);
  rmSync(stage, { recursive: true, force: true });
  return tarPath;
}

describe('installOciPlugin — floating tags (RHDHBUGS-1077)', () => {
  let destination: string;
  let workDir: string;

  beforeEach(() => {
    destination = mkdtempSync(join(tmpdir(), 'oci-dest-'));
    workDir = mkdtempSync(join(tmpdir(), 'oci-work-'));
  });

  afterEach(() => {
    rmSync(destination, { recursive: true, force: true });
    rmSync(workDir, { recursive: true, force: true });
  });

  /** Simulate a previous install of `PLUGIN_PATH` pinned to `digest`. */
  async function seedInstalled(digest: string): Promise<Map<string, string>> {
    await fs.mkdir(join(destination, PLUGIN_PATH), { recursive: true });
    await fs.writeFile(join(destination, PLUGIN_PATH, IMAGE_HASH_FILE), digest);
    await fs.writeFile(
      join(destination, PLUGIN_PATH, CONFIG_HASH_FILE),
      CONFIG_HASH,
    );
    return new Map([[CONFIG_HASH, PLUGIN_PATH]]);
  }

  it('skips the download when the remote digest matches the one on disk', async () => {
    const installed = await seedInstalled('digest-aaaa');
    const { cache, calls } = fakeImageCache({ digest: 'digest-aaaa' });

    const result = await installOciPlugin(
      ociPlugin(),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBeNull();
    expect(result.pluginConfig).toEqual({ dynamicPlugins: { frontend: {} } });
    expect(calls.getDigest).toEqual(['oci://registry.io/org/plugin:latest']);
    expect(calls.getTarball).toEqual([]);
    // The hash is dropped from `installed` so the cleanup phase does not treat
    // the still-current directory as stale.
    expect(installed.has(CONFIG_HASH)).toBe(false);
  });

  it('re-downloads when the remote digest changed even though the config hash did not', async () => {
    const installed = await seedInstalled('digest-aaaa');
    const tarball = await makeLayerTarball(workDir, '{"name":"my-plugin"}');
    const { cache, calls } = fakeImageCache({
      digest: 'digest-bbbb',
      tarball,
    });

    const result = await installOciPlugin(
      ociPlugin(),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBe(PLUGIN_PATH);
    expect(calls.getTarball).toEqual(['oci://registry.io/org/plugin:latest']);
    await expect(
      fs.readFile(join(destination, PLUGIN_PATH, 'package.json'), 'utf8'),
    ).resolves.toBe('{"name":"my-plugin"}');
    // The recorded digest must advance to the new one, otherwise the next run
    // would compare against a stale value and skip forever.
    await expect(
      fs.readFile(join(destination, PLUGIN_PATH, IMAGE_HASH_FILE), 'utf8'),
    ).resolves.toBe('digest-bbbb');
    await expect(
      fs.readFile(join(destination, PLUGIN_PATH, CONFIG_HASH_FILE), 'utf8'),
    ).resolves.toBe(CONFIG_HASH);
  });

  it('installs when a previous install left no recorded digest', async () => {
    await fs.mkdir(join(destination, PLUGIN_PATH), { recursive: true });
    const installed = new Map([[CONFIG_HASH, PLUGIN_PATH]]);
    const tarball = await makeLayerTarball(workDir, '{"name":"my-plugin"}');
    const { cache, calls } = fakeImageCache({ digest: 'digest-cccc', tarball });

    const result = await installOciPlugin(
      ociPlugin(),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBe(PLUGIN_PATH);
    expect(calls.getTarball).toHaveLength(1);
  });

  it('skips under IfNotPresent without consulting the registry, even when the digest changed', async () => {
    const installed = await seedInstalled('digest-aaaa');
    const { cache, calls } = fakeImageCache({ digest: 'digest-bbbb' });

    const result = await installOciPlugin(
      ociPlugin({ pullPolicy: PullPolicy.IF_NOT_PRESENT }),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBeNull();
    // Delimits the previous test: the re-download is driven by `Always`, not by
    // an unconditional digest check. IfNotPresent must not even ask the registry.
    expect(calls.getDigest).toEqual([]);
    expect(calls.getTarball).toEqual([]);
  });
});

describe('installOciPlugin — skopeo failures (RHDHBUGS-2439)', () => {
  const TLS_ERROR =
    'level=fatal msg=pinging container registry fake-registry.example.com: ' +
    'tls: failed to verify certificate: x509: certificate signed by unknown authority';

  let destination: string;
  let workDir: string;
  let skopeoDir: string;

  beforeEach(() => {
    destination = mkdtempSync(join(tmpdir(), 'oci-dest-'));
    workDir = mkdtempSync(join(tmpdir(), 'oci-work-'));
    skopeoDir = mkdtempSync(join(tmpdir(), 'fake-skopeo-copy-'));
  });

  afterEach(() => {
    rmSync(destination, { recursive: true, force: true });
    rmSync(workDir, { recursive: true, force: true });
    rmSync(skopeoDir, { recursive: true, force: true });
  });

  /**
   * Fake `skopeo` binary that fails `copy` the way a registry with an untrusted
   * TLS certificate does: a diagnostic on stderr and a non-zero exit.
   */
  function makeFailingSkopeo(): string {
    const binPath = join(skopeoDir, 'skopeo');
    writeFileSync(
      binPath,
      `#!/bin/sh
echo '${TLS_ERROR}' >&2
exit 1
`,
    );
    chmodSync(binPath, 0o755);
    return binPath;
  }

  it("surfaces skopeo's stderr in the error instead of only the exit status", async () => {
    const skopeo = new Skopeo(makeFailingSkopeo());
    const imageCache = new OciImageCache(skopeo, workDir);
    const plugin = ociPlugin({
      package: `oci://fake-registry.example.com/my-org/my-plugin:1.2.3!${PLUGIN_PATH}`,
      version: '1.2.3',
    });

    const error = await installOciPlugin(
      plugin,
      destination,
      imageCache,
      new Map(),
    ).then(
      () => {
        throw new Error('expected installOciPlugin to reject');
      },
      (err: unknown) => err as Error,
    );

    expect(error).toBeInstanceOf(InstallException);
    // The whole point of the bug: the operator must be able to read the cause
    // here rather than exec into the container and re-run skopeo by hand.
    expect(error.message).toContain(
      'x509: certificate signed by unknown authority',
    );
    expect(error.message).toContain('tls: failed to verify certificate');
    expect(error.message).toContain(
      'skopeo copy failed: docker://fake-registry.example.com/my-org/my-plugin:1.2.3',
    );
    expect(error.message).toContain('exit code 1');
  });
});

describe('installOciPlugin — rejected inputs', () => {
  let destination: string;

  beforeEach(() => {
    destination = mkdtempSync(join(tmpdir(), 'oci-dest-'));
  });

  afterEach(() => rmSync(destination, { recursive: true, force: true }));

  // No tarball staged: every case below must fail before any download starts.
  const unusedCache = fakeImageCache({ digest: 'unused' }).cache;

  it('returns nothing for a disabled plugin', async () => {
    const result = await installOciPlugin(
      ociPlugin({ disabled: true }),
      destination,
      unusedCache,
      new Map(),
    );
    expect(result).toEqual({ pluginPath: null, pluginConfig: {} });
  });

  it('rejects a plugin whose hash was never computed', async () => {
    await expect(
      installOciPlugin(
        ociPlugin({ plugin_hash: undefined }),
        destination,
        unusedCache,
        new Map(),
      ),
    ).rejects.toThrow(
      'Internal error: plugin oci://registry.io/org/plugin:latest!my-plugin missing plugin_hash',
    );
  });

  it('rejects a plugin with no resolved version', async () => {
    await expect(
      installOciPlugin(
        ociPlugin({ version: undefined }),
        destination,
        unusedCache,
        new Map(),
      ),
    ).rejects.toThrow(
      'No version for oci://registry.io/org/plugin:latest!my-plugin',
    );
  });

  it('rejects an image reference with no !plugin-path suffix', async () => {
    await expect(
      installOciPlugin(
        ociPlugin({ package: 'oci://registry.io/org/plugin:latest' }),
        destination,
        unusedCache,
        new Map(),
      ),
    ).rejects.toThrow(
      'OCI package oci://registry.io/org/plugin:latest missing !plugin-path suffix',
    );
  });
});
