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
import { extractPluginName } from './plugin-name';

describe('extractPluginName', () => {
  const cases: [string, string | null][] = [
    // OCI — digest
    [
      'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123',
      'backstage-plugin-foo',
    ],
    // OCI — tag
    ['oci://quay.io/rhdh/backstage-plugin-bar:v1.0.0', 'backstage-plugin-bar'],
    // OCI — latest tag
    ['oci://quay.io/rhdh/backstage-plugin-bar:latest', 'backstage-plugin-bar'],
    // OCI — registry with port, no tag
    ['oci://localhost:5000/path/my-plugin', 'my-plugin'],
    // OCI — registry with port and tag
    ['oci://localhost:5000/path/my-plugin:v1.0.0', 'my-plugin'],
    // OCI — IP address registry with port
    ['oci://10.0.0.1:5000/repo/plugin:tag', 'plugin'],
    // OCI — with !plugin-path suffix
    [
      'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123!plugin-path',
      'backstage-plugin-foo',
    ],
    // OCI — with !plugin-path with slashes
    [
      'oci://quay.io/rhdh/backstage-plugin-foo:v1.0!path/to/plugin',
      'backstage-plugin-foo',
    ],
    // OCI — with {{inherit}} tag
    [
      'oci://quay.io/rhdh/backstage-plugin-foo:{{inherit}}',
      'backstage-plugin-foo',
    ],
    // OCI — with {{inherit}} tag and !path
    [
      'oci://quay.io/rhdh/backstage-plugin-foo:{{inherit}}!some-path',
      'backstage-plugin-foo',
    ],
    // OCI — deep paths (multiple segments)
    [
      'oci://quay.io/org/sub/backstage-plugin-foo@sha256:abc123',
      'backstage-plugin-foo',
    ],
    // OCI — single path segment
    ['oci://quay.io/backstage-plugin-foo:v1.0', 'backstage-plugin-foo'],
    // OCI — registry-only URL returns null
    ['oci://localhost:5000', null],
    // OCI — trailing slash returns null
    ['oci://localhost:5000/', null],
    // OCI — host-only returns null
    ['oci://quay.io', null],
    // OCI — bare scheme returns null
    ['oci://', null],
    // OCI — malformed URL returns null
    ['oci://[invalid', null],
    // OCI — empty image name returns null
    ['oci://quay.io/rhdh/:v1.0', null],

    // HTTP(S) — .tgz with version
    [
      'https://example.com/plugins/backstage-plugin-foo-1.0.0.tgz',
      'backstage-plugin-foo',
    ],
    // HTTP(S) — .tar.gz with version
    ['https://example.com/path/my-plugin-2.3.4.tar.gz', 'my-plugin'],
    // HTTP(S) — http:// URL
    [
      'http://registry.example.com/backstage-plugin-bar-0.1.0.tgz',
      'backstage-plugin-bar',
    ],
    // HTTP(S) — with query string (stripped by URL)
    [
      'https://example.com/plugins/backstage-plugin-foo-1.0.0.tgz?token=abc',
      'backstage-plugin-foo',
    ],
    // HTTP(S) — no archive extension (version still stripped)
    [
      'https://example.com/plugins/backstage-plugin-foo-1.0.0',
      'backstage-plugin-foo',
    ],
    // HTTP(S) — no version suffix (name returned as-is)
    [
      'https://example.com/plugins/backstage-plugin-foo.tgz',
      'backstage-plugin-foo',
    ],
    // HTTP(S) — .tar.gz without version
    [
      'https://example.com/plugins/backstage-plugin-foo.tar.gz',
      'backstage-plugin-foo',
    ],
    // HTTP(S) — no path returns null
    ['https://example.com', null],
    // HTTP(S) — trailing slash returns null
    ['https://example.com/', null],
    // HTTP(S) — bare scheme returns null
    ['https://', null],
    // HTTP(S) — pre-release version
    [
      'https://example.com/plugins/backstage-plugin-foo-1.0.0-beta.1.tgz',
      'backstage-plugin-foo',
    ],
    // HTTP(S) — plugin name containing digits
    [
      'https://example.com/plugins/plugin-3scale-backend-1.2.3.tgz',
      'plugin-3scale-backend',
    ],

    // Local path — deep
    [
      './dynamic-plugins/dist/backstage-plugin-techdocs',
      'backstage-plugin-techdocs',
    ],
    // Local path — shallow
    ['./plugin-foo', 'plugin-foo'],
    // Local path — trailing slash
    ['./foo/', 'foo'],
    // Local path — bare prefix
    ['./', '.'],

    // Unknown formats return null
    ['@backstage/plugin-catalog', null],
    ['some-package', null],
    ['', null],
  ];

  it.each(cases)('parses %s -> %s', (input, expected) => {
    expect(extractPluginName(input)).toBe(expected);
  });
});
