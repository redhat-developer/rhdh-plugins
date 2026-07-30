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
import { basename } from 'node:path';
import { isHttpUrl, isLocalPath, isOciUrl } from './protocols';

/**
 * Extract the human-readable plugin name from a package URL.
 *
 * Supports OCI (`oci://`), HTTP(S) (`.tgz`/`.tar.gz` archives), and
 * local (`./`) paths. Returns `null` for unrecognized formats.
 */
export function extractPluginName(pkg: string): string | null {
  if (isOciUrl(pkg)) return ociName(pkg);
  if (isHttpUrl(pkg)) return httpName(pkg);
  if (isLocalPath(pkg)) return basename(pkg);
  return null;
}

/**
 * Extract the plugin name from an OCI URL by stripping the plugin path
 * (`!` suffix), digest, and tag.
 *
 * @example
 * ociName('oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123') // 'backstage-plugin-foo'
 * ociName('oci://quay.io/rhdh/backstage-plugin-foo:v1.0!path') // 'backstage-plugin-foo'
 * ociName('oci://localhost:5000/path/my-plugin:v1.0.0') // 'my-plugin'
 */
function ociName(pkg: string): string | null {
  const withoutBang = pkg.split('!').at(0) as string;

  if (!URL.canParse(withoutBang)) return null;

  const segment = basename(new URL(withoutBang).pathname);
  if (!segment) return null;

  const beforeDigest = segment.split('@').at(0) as string;
  const name = beforeDigest.split(':').at(0) as string;

  return name || null;
}

/**
 * Extract the plugin name from an HTTP(S) URL by stripping the archive
 * extension and version suffix.
 *
 * @example
 * httpName('https://example.com/backstage-plugin-foo-1.0.0.tgz') // 'backstage-plugin-foo'
 * httpName('https://example.com/plugin-3scale-backend-1.2.3.tar.gz') // 'plugin-3scale-backend'
 * httpName('https://example.com/backstage-plugin-foo.tgz') // 'backstage-plugin-foo'
 */
function httpName(pkg: string): string | null {
  if (!URL.canParse(pkg)) return null;

  const name = basename(new URL(pkg).pathname)
    .replace(/\.(tar\.gz|tgz)$/, '')
    .replace(/(.*)-\d.*$/, '$1');

  return name || null;
}
