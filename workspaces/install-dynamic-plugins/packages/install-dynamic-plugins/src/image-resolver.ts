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
import { log } from './log.js';
import { type Skopeo } from './skopeo.js';
import {
  DOCKER_PROTO,
  OCI_PROTO,
  RHDH_FALLBACK,
  RHDH_REGISTRY,
} from './types.js';

/**
 * Resolve a (possibly oci:// / docker://) image reference. If it points at
 * `registry.access.redhat.com/rhdh/...` and that registry rejects the image,
 * fall back to `quay.io/rhdh/...` (same protocol). Mirrors fast.py `resolve_image`.
 */
export async function resolveImage(
  skopeo: Skopeo,
  image: string,
): Promise<string> {
  const { proto, raw } = stripProto(image);
  if (!raw.startsWith(RHDH_REGISTRY)) return image;

  const dockerUrl = `${DOCKER_PROTO}${raw}`;
  if (await skopeo.exists(dockerUrl)) return image;

  const fallback = raw.replace(RHDH_REGISTRY, RHDH_FALLBACK);
  log(`\t==> Falling back to ${RHDH_FALLBACK} for ${raw}`);
  return `${proto}${fallback}`;
}

function stripProto(image: string): { proto: string; raw: string } {
  if (image.startsWith(OCI_PROTO))
    return { proto: OCI_PROTO, raw: image.slice(OCI_PROTO.length) };
  if (image.startsWith(DOCKER_PROTO))
    return { proto: DOCKER_PROTO, raw: image.slice(DOCKER_PROTO.length) };
  return { proto: '', raw: image };
}
