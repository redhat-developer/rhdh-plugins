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

/**
 * A `:latest!` package with no explicit `pullPolicy`. The absent policy is
 * deliberate: `effectivePullPolicy` (types.ts) derives `Always` from the
 * `:latest!` marker, and that derivation is what makes the RHDHBUGS-1077 fix
 * reach a real `dynamic-plugins.yaml`, which never spells the policy out.
 * Hard-coding `pullPolicy` here would leave that default unexercised.
 */
function ociPlugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    package: `oci://registry.io/org/plugin:latest!${PLUGIN_PATH}`,
    version: 'latest',
    plugin_hash: CONFIG_HASH,
    pluginConfig: { dynamicPlugins: { frontend: {} } },
    ...overrides,
  };
}

type CacheCalls = { getTarball: string[]; getDigest: string[] };

/**
 * Fake `OciImageCache` recording every call. Faking at this seam (rather than
 * at `skopeo`) keeps the digest tests free of any registry interaction — the
 * behaviour under test is `isAlreadyInstalled`, not the download itself.
 *
 * Named for what it does rather than `fakeImageCache`, which already exists in
 * oci-key.test.ts with a different contract.
 */
function recordingImageCache(opts: { digest: string; tarball?: string }): {
  cache: OciImageCache;
  calls: CacheCalls;
} {
  const calls: CacheCalls = { getTarball: [], getDigest: [] };
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

let destination: string;
let workDir: string;
let skopeoDir: string;

beforeEach(() => {
  destination = mkdtempSync(join(tmpdir(), 'oci-dest-'));
  workDir = mkdtempSync(join(tmpdir(), 'oci-work-'));
  skopeoDir = mkdtempSync(join(tmpdir(), 'fake-skopeo-copy-'));
});

afterEach(() => {
  for (const dir of [destination, workDir, skopeoDir]) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Pack `<pluginPath>/package.json` into a layer tarball `extractOciPlugin` can read. */
async function makeLayerTarball(
  pluginPath: string,
  body: string,
): Promise<string> {
  const stage = mkdtempSync(join(tmpdir(), 'oci-layer-stage-'));
  mkdirSync(join(stage, pluginPath), { recursive: true });
  writeFileSync(join(stage, pluginPath, 'package.json'), body);
  const tarPath = join(workDir, 'layer.tar');
  await tar.c({ gzip: false, file: tarPath, cwd: stage }, [pluginPath]);
  rmSync(stage, { recursive: true, force: true });
  return tarPath;
}

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

describe('installOciPlugin — floating tags (RHDHBUGS-1077)', () => {
  it('skips the download when the remote digest matches the one on disk', async () => {
    const installed = await seedInstalled('digest-aaaa');
    const { cache, calls } = recordingImageCache({ digest: 'digest-aaaa' });

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
    const tarball = await makeLayerTarball(PLUGIN_PATH, '{"name":"my-plugin"}');
    const { cache, calls } = recordingImageCache({
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
    // markAsFresh: the directory was just rewritten, so the stale entry must go
    // or the cleanup phase deletes what this call installed.
    expect(installed.has(CONFIG_HASH)).toBe(false);
  });

  it('installs when a previous install left no recorded digest', async () => {
    await fs.mkdir(join(destination, PLUGIN_PATH), { recursive: true });
    const installed = new Map([[CONFIG_HASH, PLUGIN_PATH]]);
    const tarball = await makeLayerTarball(PLUGIN_PATH, '{"name":"my-plugin"}');
    const { cache, calls } = recordingImageCache({
      digest: 'digest-cccc',
      tarball,
    });

    const result = await installOciPlugin(
      ociPlugin(),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBe(PLUGIN_PATH);
    expect(calls.getTarball).toHaveLength(1);
    // The repair is only complete once the digest is recorded, otherwise every
    // subsequent run re-downloads.
    await expect(
      fs.readFile(join(destination, PLUGIN_PATH, IMAGE_HASH_FILE), 'utf8'),
    ).resolves.toBe('digest-cccc');
  });

  it('skips under an explicit IfNotPresent without consulting the registry, even when the digest changed', async () => {
    const installed = await seedInstalled('digest-aaaa');
    const { cache, calls } = recordingImageCache({ digest: 'digest-bbbb' });

    const result = await installOciPlugin(
      ociPlugin({ pullPolicy: PullPolicy.IF_NOT_PRESENT }),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBeNull();
    // Delimits the previous test: the re-download is driven by the policy, not
    // by an unconditional digest check. IfNotPresent must not even ask.
    expect(calls.getDigest).toEqual([]);
    expect(calls.getTarball).toEqual([]);
  });

  it('skips a pinned tag with no explicit policy, since only :latest! defaults to Always', async () => {
    await fs.mkdir(join(destination, PLUGIN_PATH), { recursive: true });
    await fs.writeFile(
      join(destination, PLUGIN_PATH, IMAGE_HASH_FILE),
      'digest-aaaa',
    );
    const installed = new Map([[CONFIG_HASH, PLUGIN_PATH]]);
    const { cache, calls } = recordingImageCache({ digest: 'digest-bbbb' });

    const result = await installOciPlugin(
      ociPlugin({
        package: `oci://registry.io/org/plugin:1.2.3!${PLUGIN_PATH}`,
        version: '1.2.3',
      }),
      destination,
      cache,
      installed,
    );

    // The other direction of the same default: a pinned tag must NOT be
    // re-pulled on every run just because its digest moved.
    expect(result.pluginPath).toBeNull();
    expect(calls.getDigest).toEqual([]);
  });

  it('re-installs rather than skipping when the configured pullPolicy is not a recognised value', async () => {
    // `dynamic-plugins.yaml` is read with `parseYaml(...) as DynamicPluginsConfig`
    // (installer.ts) — a type assertion, not a runtime check — so a typo like
    // `pullPolicy: Never` reaches here as an unrecognised string. It must fall
    // through to a re-install; silently skipping would strand the plugin at
    // whatever version happened to be on disk.
    const installed = await seedInstalled('digest-aaaa');
    const tarball = await makeLayerTarball(PLUGIN_PATH, '{"name":"my-plugin"}');
    const { cache, calls } = recordingImageCache({
      digest: 'digest-aaaa',
      tarball,
    });

    const result = await installOciPlugin(
      ociPlugin({ pullPolicy: 'Never' as PullPolicy }),
      destination,
      cache,
      installed,
    );

    expect(result.pluginPath).toBe(PLUGIN_PATH);
    expect(calls.getTarball).toHaveLength(1);
    // Never consults the registry for a digest it would not know how to act on.
    expect(calls.getDigest).toEqual(['oci://registry.io/org/plugin:latest']);
  });
});

describe('installOciPlugin — package spec handling', () => {
  it('keeps a plugin path containing ! on the right of the first separator', async () => {
    // installer-oci.ts documents that `!` is legal inside a plugin path and
    // that the split is on the FIRST separator. lastIndexOf would silently
    // install `plugin` from an image named `...:latest!my`.
    const bangPath = 'my!plugin';
    const tarball = await makeLayerTarball(bangPath, '{"name":"bang"}');
    const { cache, calls } = recordingImageCache({
      digest: 'digest-dddd',
      tarball,
    });

    const result = await installOciPlugin(
      ociPlugin({ package: `oci://registry.io/org/plugin:latest!${bangPath}` }),
      destination,
      cache,
      new Map(),
    );

    expect(result.pluginPath).toBe(bangPath);
    expect(calls.getTarball).toEqual(['oci://registry.io/org/plugin:latest']);
    await expect(
      fs.readFile(join(destination, bangPath, 'package.json'), 'utf8'),
    ).resolves.toBe('{"name":"bang"}');
  });

  it('returns an empty config for a plugin that declares none', async () => {
    const tarball = await makeLayerTarball(PLUGIN_PATH, '{"name":"my-plugin"}');
    const { cache } = recordingImageCache({ digest: 'digest-eeee', tarball });

    const result = await installOciPlugin(
      ociPlugin({ pluginConfig: undefined }),
      destination,
      cache,
      new Map(),
    );

    // The merger receives this verbatim; `undefined` and `{}` are not the same
    // thing at that boundary.
    expect(result.pluginConfig).toEqual({});
  });
});

describe('installOciPlugin — skopeo failures (RHDHBUGS-2439)', () => {
  const TLS_ERROR =
    'level=fatal msg=pinging container registry fake-registry.example.com: ' +
    'tls: failed to verify certificate: x509: certificate signed by unknown authority';

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

    const failing = installOciPlugin(
      plugin,
      destination,
      imageCache,
      new Map(),
    );

    await expect(failing).rejects.toBeInstanceOf(InstallException);
    // The whole point of the bug: the operator must be able to read the cause
    // here rather than exec into the container and re-run skopeo by hand.
    await expect(failing).rejects.toThrow(
      'x509: certificate signed by unknown authority',
    );
    await expect(failing).rejects.toThrow('tls: failed to verify certificate');
    await expect(failing).rejects.toThrow(
      'skopeo copy failed: docker://fake-registry.example.com/my-org/my-plugin:1.2.3',
    );
    await expect(failing).rejects.toThrow('exit code 1');
  });
});

describe('installOciPlugin — rejected inputs', () => {
  /** No tarball staged: every case below must fail before any download starts. */
  const unusedCache = () => recordingImageCache({ digest: 'unused' }).cache;

  it('drops the config of a disabled plugin instead of merging it', async () => {
    const result = await installOciPlugin(
      ociPlugin({ disabled: true }),
      destination,
      unusedCache(),
      new Map(),
    );
    expect(result).toEqual({ pluginPath: null, pluginConfig: {} });
  });

  it('rejects a plugin whose hash was never computed', async () => {
    await expect(
      installOciPlugin(
        ociPlugin({ plugin_hash: undefined }),
        destination,
        unusedCache(),
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
        unusedCache(),
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
        unusedCache(),
        new Map(),
      ),
    ).rejects.toThrow(
      'OCI package oci://registry.io/org/plugin:latest missing !plugin-path suffix',
    );
  });
});
