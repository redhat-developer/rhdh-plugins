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
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { InstallException } from './errors';
import { OciImageCache } from './image-cache';
import { ociPluginKey } from './oci-key';
import { Skopeo, type SkopeoInspect } from './skopeo';

const IMAGE = 'oci://registry.io/org/plugin:1.0';
const DOCKER_URL = 'docker://registry.io/org/plugin:1.0';
const ANNOTATION = 'io.backstage.dynamic-packages';

/**
 * Fake `Skopeo` returning canned `inspect`/`inspectRaw` payloads. Same seam as
 * `image-resolver.test.ts` — the registry is never contacted.
 *
 * No `exists` stub: `resolveImage` only probes it for images under
 * `RHDH_REGISTRY` (types.ts), and `IMAGE` deliberately is not one.
 */
function fakeSkopeo(responses: {
  inspectRaw?: unknown;
  inspect?: SkopeoInspect;
}): { skopeo: Skopeo; urls: string[] } {
  const urls: string[] = [];
  const skopeo = {
    inspectRaw: async (url: string) => {
      urls.push(url);
      return responses.inspectRaw;
    },
    inspect: async (url: string) => {
      urls.push(url);
      return responses.inspect;
    },
  } as unknown as Skopeo;
  return { skopeo, urls };
}

function encodeAnnotation(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

function cacheFor(responses: {
  inspectRaw?: unknown;
  inspect?: SkopeoInspect;
}): { cache: OciImageCache; urls: string[] } {
  const { skopeo, urls } = fakeSkopeo(responses);
  return { cache: new OciImageCache(skopeo, '/unused-tmp-dir'), urls };
}

describe('OciImageCache.getPluginPaths — dynamic-packages annotation', () => {
  it('reads the declared plugin paths from the annotation', async () => {
    const { cache, urls } = cacheFor({
      inspectRaw: {
        annotations: {
          [ANNOTATION]: encodeAnnotation([
            { 'backstage-plugin-one': { version: '1.0.0' } },
            { 'backstage-plugin-two': { version: '2.0.0' } },
          ]),
        },
      },
    });

    await expect(cache.getPluginPaths(IMAGE)).resolves.toEqual([
      'backstage-plugin-one',
      'backstage-plugin-two',
    ]);
    // The manifest is read over docker://, not oci:// — skopeo inspect --raw
    // does not accept the oci:// form for a remote registry.
    expect(urls).toEqual([DOCKER_URL]);
  });

  it('returns no paths when the image carries no annotation at all (RHDHBUGS-2530)', async () => {
    const { cache } = cacheFor({ inspectRaw: { layers: [{ digest: 'x' }] } });
    await expect(cache.getPluginPaths(IMAGE)).resolves.toEqual([]);
  });

  it('returns no paths when the annotation encodes an empty list (RHDHBUGS-3556)', async () => {
    // Built rather than pasted as the literal `W10=` it is on the wire, so the
    // fixture provably encodes `[]` and this case cannot silently drift into
    // the "not a list" branch below. The code does NOT distinguish this from a
    // missing annotation: both collapse to `[]` and raise the same error. See
    // the end-to-end test at the bottom of this file for that shared outcome.
    const { cache } = cacheFor({
      inspectRaw: { annotations: { [ANNOTATION]: encodeAnnotation([]) } },
    });
    await expect(cache.getPluginPaths(IMAGE)).resolves.toEqual([]);
  });

  it('returns no paths when the annotation decodes to something other than a list', async () => {
    const { cache } = cacheFor({
      inspectRaw: {
        annotations: { [ANNOTATION]: encodeAnnotation({ 'a-plugin': {} }) },
      },
    });
    await expect(cache.getPluginPaths(IMAGE)).resolves.toEqual([]);
  });

  it('names the annotation and the image when the payload cannot be decoded', async () => {
    const { cache } = cacheFor({
      inspectRaw: {
        annotations: {
          [ANNOTATION]: Buffer.from('this is not json').toString('base64'),
        },
      },
    });

    const failing = cache.getPluginPaths(IMAGE);

    await expect(failing).rejects.toBeInstanceOf(InstallException);
    await expect(failing).rejects.toThrow(`Could not decode '${ANNOTATION}'`);
    await expect(failing).rejects.toThrow(IMAGE);
    // The underlying parser message is appended but not asserted verbatim — its
    // wording is a V8 implementation detail and varies across Node versions.
  });
});

describe('OciImageCache.getDigest', () => {
  it('returns the hash portion of the digest reported by the registry', async () => {
    const { cache, urls } = cacheFor({ inspect: { Digest: 'sha256:abc123' } });
    await expect(cache.getDigest(IMAGE)).resolves.toBe('abc123');
    expect(urls).toEqual([DOCKER_URL]);
  });

  it('rejects when the registry reports no digest', async () => {
    const { cache } = cacheFor({ inspect: { Name: 'plugin' } });
    await expect(cache.getDigest(IMAGE)).rejects.toThrow(
      `No digest returned for ${IMAGE}`,
    );
  });

  it('rejects a digest with no algorithm separator', async () => {
    const { cache } = cacheFor({ inspect: { Digest: 'abc123' } });
    await expect(cache.getDigest(IMAGE)).rejects.toThrow(
      `Malformed digest abc123 for ${IMAGE}`,
    );
  });
});

describe('an image with no usable annotation, end to end (RHDHBUGS-2530 / RHDHBUGS-3556)', () => {
  let skopeoDir: string;

  beforeEach(() => {
    skopeoDir = mkdtempSync(join(tmpdir(), 'fake-skopeo-manifest-'));
  });

  afterEach(() => rmSync(skopeoDir, { recursive: true, force: true }));

  /** Fake `skopeo` whose `inspect --raw` returns `manifest` verbatim. */
  function makeInspectingSkopeo(manifest: string): Skopeo {
    const binPath = join(skopeoDir, 'skopeo');
    writeFileSync(
      binPath,
      `#!/bin/sh
cat <<'MANIFEST'
${manifest}
MANIFEST
`,
    );
    chmodSync(binPath, 0o755);
    return new Skopeo(binPath);
  }

  /**
   * The two halves of this bug are asserted separately above and in
   * oci-key.test.ts, but each is driven by a stub of the other. This crosses
   * the seam: a real manifest off a real `skopeo inspect`, through the real
   * `OciImageCache`, into the real `ociPluginKey` — the only test here that
   * reproduces what the customer actually hit.
   */
  it.each([
    ['carries no annotation', '{"layers":[{"digest":"sha256:abc"}]}'],
    // W10= is base64 for [] — the exact value found on the two artifacts in
    // RHDHBUGS-3556, which published cleanly but declared nothing.
    [
      'declares an empty package list',
      `{"annotations":{"${ANNOTATION}":"W10="}}`,
    ],
  ])('fails with a readable message when the image %s', async (_, manifest) => {
    const cache = new OciImageCache(
      makeInspectingSkopeo(manifest),
      '/unused-tmp-dir',
    );

    await expect(ociPluginKey(IMAGE, cache)).rejects.toThrow(
      `No plugins found in OCI image ${IMAGE}. ` +
        `The image might not contain the '${ANNOTATION}' annotation. ` +
        'Please ensure it was packaged using the @red-hat-developer-hub/cli plugin package command.',
    );
  });
});

describe('OciImageCache.getTarball', () => {
  const LAYER = 'deadbeefcafe';
  const GOOD_MANIFEST = `{"layers":[{"digest":"sha256:${LAYER}"}]}`;

  let skopeoDir: string;
  let cacheDir: string;
  let logPath: string;

  beforeEach(() => {
    skopeoDir = mkdtempSync(join(tmpdir(), 'fake-skopeo-copy-'));
    cacheDir = mkdtempSync(join(tmpdir(), 'oci-cache-'));
    logPath = join(skopeoDir, 'invocations.log');
  });

  afterEach(() => {
    for (const dir of [skopeoDir, cacheDir]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /** Every `skopeo` invocation, one per line, in call order. */
  function invocations(): string[] {
    if (!existsSync(logPath)) return [];
    return readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  }

  /**
   * Fake `skopeo` that materialises a `manifest.json` and the layer blob at the
   * `dir:` destination, the way a real `copy` does. Same technique as
   * `extra-catalog-index.test.ts`, plus the invocation log from
   * `skopeo.test.ts` so the dedup tests can count forks.
   *
   * With `failFirstCall` the first invocation exits non-zero and every later
   * one succeeds, which is what a transient registry error looks like.
   */
  function makeCopyingSkopeo(opts: {
    manifest?: string;
    failFirstCall?: boolean;
  }): Skopeo {
    const binPath = join(skopeoDir, 'skopeo');
    const marker = join(skopeoDir, 'first-call-done');
    const failBlock = opts.failFirstCall
      ? `if [ ! -f "${marker}" ]; then
  touch "${marker}"
  echo 'simulated transport failure' >&2
  exit 1
fi
`
      : '';
    writeFileSync(
      binPath,
      `#!/bin/sh
echo "$@" >> "${logPath}"
${failBlock}DST=""
for arg in "$@"; do
  case "$arg" in
    dir:*) DST="\${arg#dir:}" ;;
  esac
done
mkdir -p "$DST"
: > "$DST/${LAYER}"
cat > "$DST/manifest.json" <<'MANIFEST'
${opts.manifest ?? GOOD_MANIFEST}
MANIFEST
`,
    );
    chmodSync(binPath, 0o755);
    return new Skopeo(binPath);
  }

  function cacheWith(opts: {
    manifest?: string;
    failFirstCall?: boolean;
  }): OciImageCache {
    return new OciImageCache(makeCopyingSkopeo(opts), cacheDir);
  }

  it('copies the image and returns the path to its single layer blob', async () => {
    const cache = cacheWith({});

    const tarball = await cache.getTarball(IMAGE);

    // The directory is keyed by sha256 of the resolved ref, so assert the leaf
    // and the containment rather than re-deriving the hash here.
    expect(basename(tarball)).toBe(LAYER);
    expect(tarball.startsWith(cacheDir)).toBe(true);
    expect(existsSync(tarball)).toBe(true);
    expect(invocations()).toEqual([
      `copy --override-os=linux --override-arch=amd64 ${DOCKER_URL} dir:${dirname(tarball)}`,
    ]);
  });

  // One error, two manifest shapes that reach it through the same optional
  // chain. Measured: dropping either case changes no covered branch, so they
  // are a table of equivalent inputs rather than two independent tests — the
  // form oci-key.test.ts already uses for its invalidCases.
  it.each([
    ['declares an empty layer list', '{"layers":[]}'],
    ['has no layers key at all', '{}'],
  ])('names the image when the manifest %s', async (_, manifest) => {
    const cache = cacheWith({ manifest });
    await expect(cache.getTarball(IMAGE)).rejects.toThrow(
      `OCI manifest for ${IMAGE} has no layers`,
    );
  });

  it('names the offending digest when a layer digest carries no algorithm', async () => {
    const cache = cacheWith({ manifest: '{"layers":[{"digest":"nocolon"}]}' });
    const failing = cache.getTarball(IMAGE);

    await expect(failing).rejects.toBeInstanceOf(InstallException);
    await expect(failing).rejects.toThrow(
      `Malformed layer digest nocolon in ${IMAGE}`,
    );
  });

  it('shares one skopeo copy between concurrent callers for the same image', async () => {
    const cache = cacheWith({});

    // The multi-plugin overlay case the class docblock is written for: several
    // plugins in one image, all asking for the tarball at once.
    const [a, b, c] = await Promise.all([
      cache.getTarball(IMAGE),
      cache.getTarball(IMAGE),
      cache.getTarball(IMAGE),
    ]);

    expect(invocations()).toHaveLength(1);
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('still copies once per image when two different images are requested', async () => {
    const cache = cacheWith({});
    const other = 'oci://registry.io/org/other:2.0';

    await Promise.all([cache.getTarball(IMAGE), cache.getTarball(other)]);

    // Delimits the previous test: the cache keys on the image, it does not
    // collapse every caller onto one download.
    expect(invocations()).toHaveLength(2);
  });

  it('evicts a failed download so the next caller retries instead of replaying the rejection', async () => {
    const cache = cacheWith({ failFirstCall: true });

    await expect(cache.getTarball(IMAGE)).rejects.toThrow(
      'simulated transport failure',
    );
    // Without the eviction the rejected promise stays in the map and every
    // later caller gets the first failure back, forever.
    await expect(cache.getTarball(IMAGE)).resolves.toContain(LAYER);
    expect(invocations()).toHaveLength(2);
  });
});
