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

import type { BackendFeature } from '@backstage/backend-plugin-api';
// eslint-disable-next-line @backstage/no-undeclared-imports -- Shared fixtures are imported only by tests.
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { Config } from '../config';

import { createHash } from 'node:crypto';
import type { OciManifest } from './services/types';

/** Builds a minimal valid OCI manifest with the given layers. */
export function makeManifest(layers: OciManifest['layers'] = []): OciManifest {
  return {
    schemaVersion: 2,
    config: {
      mediaType: 'application/vnd.oci.image.config.v1+json',
      digest: 'sha256:cfg',
      size: 10,
    },
    layers,
  };
}

/** Computes the SHA-256 digest of a serialized manifest. */
export function computeManifestDigest(manifest: OciManifest): string {
  const buffer = Buffer.from(JSON.stringify(manifest));
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
}

/**
 * Creates a minimal valid tar archive containing the given files.
 */
export function createTarArchive(
  files: Array<{ name: string; content: string }>,
): Buffer {
  const blocks: Buffer[] = [];

  for (const file of files) {
    const contentBuf = Buffer.from(file.content, 'utf-8');
    const header = Buffer.alloc(512);

    // File name (bytes 0–99)
    header.write(file.name, 0, Math.min(file.name.length, 100), 'utf-8');

    // File mode (bytes 100–107)
    header.write('0000644\0', 100, 8, 'utf-8');

    // Owner UID (bytes 108–115)
    header.write('0000000\0', 108, 8, 'utf-8');

    // Group GID (bytes 116–123)
    header.write('0000000\0', 116, 8, 'utf-8');

    // File size in octal (bytes 124–135)
    const sizeOctal = contentBuf.length.toString(8).padStart(11, '0');
    header.write(`${sizeOctal}\0`, 124, 12, 'utf-8');

    // Modification time (bytes 136–147)
    header.write('00000000000\0', 136, 12, 'utf-8');

    // Type flag (byte 156): '0' = regular file
    header[156] = 0x30;

    // Compute and write checksum (bytes 148–155)
    // Checksum is computed with the checksum field treated as spaces (0x20)
    for (let i = 148; i < 156; i++) {
      header[i] = 0x20;
    }
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    header.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'utf-8',
    );

    blocks.push(header);

    // File data padded to 512-byte boundary
    const padding = 512 - (contentBuf.length % 512 || 512);
    blocks.push(contentBuf);
    if (padding > 0 && padding < 512) {
      blocks.push(Buffer.alloc(padding));
    }
  }

  // End-of-archive: two 512-byte zero blocks
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

// Expand imported config interfaces into structural JSON objects accepted by
// Backstage's config test service while retaining schema checking at call sites.
type JsonConfig<T> = T extends object
  ? { [K in keyof T]: JsonConfig<T[K]> }
  : T;
export type ConnectorTestConfig = JsonConfig<
  NonNullable<Config['skillImageConnector']>
>;

/** Shared manifest resolution used by connector integration fixtures. */
export const resolvedDigest = `sha256:${'a'.repeat(64)}`;

/** Pin a fixture reference to its shared resolved manifest digest. */
export const pinnedRef = (ref: string): string => `${ref}@${resolvedDigest}`;

/** Start a connector backend without importing the plugin into low-level fixture users. */
export function startConnector(
  settings: ConnectorTestConfig,
  logger: ReturnType<typeof mockServices.logger.mock>,
  plugin: BackendFeature,
  scheduler: BackendFeature = mockServices.scheduler.factory({
    includeInitialDelayedTasksOnStartup: true,
  }),
  extraFeatures: BackendFeature[] = [],
) {
  return startTestBackend({
    features: [
      plugin,
      ...extraFeatures,
      mockServices.rootLogger.factory(),
      logger.factory,
      scheduler,
      mockServices.rootConfig.factory({
        data: {
          app: { baseUrl: 'http://localhost:3000' },
          backend: { baseUrl: 'http://localhost:7007' },
          skillImageConnector: {
            ...(settings.sources === undefined
              ? { allowedRegistries: ['quay.io'] }
              : {}),
            ...settings,
          },
        },
      }),
    ],
  });
}
