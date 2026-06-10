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
import { resolveImage } from './image-resolver';
import type { Skopeo } from './skopeo';

function fakeSkopeo(exists: (url: string) => boolean): Skopeo {
  return { exists: async (url: string) => exists(url) } as unknown as Skopeo;
}

describe('resolveImage', () => {
  it('returns non-RHDH images unchanged', async () => {
    const sk = fakeSkopeo(() => true);
    await expect(
      resolveImage(sk, 'oci://quay.io/other/plugin:1.0'),
    ).resolves.toBe('oci://quay.io/other/plugin:1.0');
  });

  it('returns the RHDH image unchanged when it exists', async () => {
    const sk = fakeSkopeo(() => true);
    await expect(
      resolveImage(sk, 'oci://registry.access.redhat.com/rhdh/plugin:1.0'),
    ).resolves.toBe('oci://registry.access.redhat.com/rhdh/plugin:1.0');
  });

  it('falls back to quay.io/rhdh when the RHDH image is missing', async () => {
    const sk = fakeSkopeo(() => false);
    await expect(
      resolveImage(sk, 'oci://registry.access.redhat.com/rhdh/plugin:1.0'),
    ).resolves.toBe('oci://quay.io/rhdh/plugin:1.0');
  });

  it('preserves the docker:// protocol on fallback', async () => {
    const sk = fakeSkopeo(() => false);
    await expect(
      resolveImage(sk, 'docker://registry.access.redhat.com/rhdh/plugin:1.0'),
    ).resolves.toBe('docker://quay.io/rhdh/plugin:1.0');
  });
});
