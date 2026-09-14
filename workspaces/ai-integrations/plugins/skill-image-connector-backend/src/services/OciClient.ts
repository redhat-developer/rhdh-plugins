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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ImageRef, OciManifest } from './types';

/**
 * Parses an image reference string into its components.
 *
 * Supports formats:
 *   registry/repo:tag
 *   registry/repo          (tag defaults to "latest")
 */
export function parseImageRef(ref: string): ImageRef {
  // Strip any oci:// prefix
  const cleaned = ref.replace(/^oci:\/\//, '');

  let tag = 'latest';
  let rest = cleaned;

  // The tag follows the last colon, but only if it appears
  // after the registry host portion (after the first slash).
  const slashIdx = rest.indexOf('/');
  if (slashIdx !== -1) {
    const afterSlash = rest.substring(slashIdx);
    const colonIdx = afterSlash.lastIndexOf(':');
    if (colonIdx !== -1) {
      tag = afterSlash.substring(colonIdx + 1);
      rest = rest.substring(0, slashIdx) + afterSlash.substring(0, colonIdx);
    }
  }

  const firstSlash = rest.indexOf('/');
  if (firstSlash === -1) {
    throw new Error(
      `Invalid image reference "${ref}": expected format registry/repository[:tag]`,
    );
  }

  const registry = rest.substring(0, firstSlash);
  const repository = rest.substring(firstSlash + 1);

  if (!registry || !repository) {
    throw new Error(
      `Invalid image reference "${ref}": registry and repository are required`,
    );
  }

  return { registry, repository, tag };
}

/**
 * Fetches an OCI image manifest from a registry using the OCI
 * Distribution Spec v2 HTTP API.
 */
export async function fetchManifest(
  imageRef: ImageRef,
  logger: LoggerService,
): Promise<OciManifest> {
  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/manifests/${imageRef.tag}`;
  logger.info(`Fetching OCI manifest from ${url}`);

  const response = await fetch(url, {
    headers: {
      Accept: [
        'application/vnd.oci.image.manifest.v1+json',
        'application/vnd.docker.distribution.manifest.v2+json',
      ].join(', '),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch manifest for ${imageRef.registry}/${imageRef.repository}:${imageRef.tag}: ${response.status} ${response.statusText}`,
    );
  }

  const manifest = (await response.json()) as OciManifest;
  return manifest;
}

/**
 * Downloads a blob (layer) from the registry and returns it as a Buffer.
 */
export async function fetchBlob(
  imageRef: ImageRef,
  digest: string,
  logger: LoggerService,
): Promise<Buffer> {
  const url = `https://${imageRef.registry}/v2/${imageRef.repository}/blobs/${digest}`;
  logger.debug(`Fetching blob ${digest} from ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch blob ${digest} from ${imageRef.registry}/${imageRef.repository}: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
