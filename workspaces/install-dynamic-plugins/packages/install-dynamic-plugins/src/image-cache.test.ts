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
import { InstallException } from './errors';
import { OciImageCache } from './image-cache';
import type { Skopeo, SkopeoInspect } from './skopeo';

const IMAGE = 'oci://registry.io/org/plugin:1.0';
const DOCKER_URL = 'docker://registry.io/org/plugin:1.0';
const ANNOTATION = 'io.backstage.dynamic-packages';

/**
 * Fake `Skopeo` returning canned `inspect`/`inspectRaw` payloads. Same seam as
 * `image-resolver.test.ts` — the registry is never contacted.
 */
function fakeSkopeo(responses: {
  inspectRaw?: unknown;
  inspect?: SkopeoInspect;
}): { skopeo: Skopeo; urls: string[] } {
  const urls: string[] = [];
  const skopeo = {
    exists: async () => true,
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

  it('returns no paths when the annotation is present but encodes an empty list (RHDHBUGS-3556)', async () => {
    // `W10=` is base64 for `[]` — the exact value found on the two community
    // backend artifacts. The code deliberately does NOT distinguish this from a
    // missing annotation: both collapse to `[]`, so the caller
    // (`oci-key.ts:autoDetectPluginPath`) raises the same
    // "No plugins found in OCI image ..." error for either. Asserting the
    // shared outcome is the honest test; there is no separate branch to cover.
    const { cache } = cacheFor({
      inspectRaw: { annotations: { [ANNOTATION]: 'W10=' } },
    });
    await expect(cache.getPluginPaths(IMAGE)).resolves.toEqual([]);
    expect('W10=').toBe(encodeAnnotation([]));
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

    const error = await cache.getPluginPaths(IMAGE).then(
      () => {
        throw new Error('expected getPluginPaths to reject');
      },
      (err: unknown) => err as Error,
    );

    expect(error).toBeInstanceOf(InstallException);
    expect(error.message).toContain(`Could not decode '${ANNOTATION}'`);
    expect(error.message).toContain(IMAGE);
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
