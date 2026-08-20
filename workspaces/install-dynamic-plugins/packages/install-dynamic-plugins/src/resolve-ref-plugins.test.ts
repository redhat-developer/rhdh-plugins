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
import { resolveRefPlugins } from './installer';
import type { IncludePluginList, PluginSpec } from './types';

describe('resolveRefPlugins', () => {
  it('resolves ref:// entries across include files and package types', () => {
    const main: PluginSpec[] = [
      { package: 'ref://backstage-plugin-foo', enabled: true },
      { package: 'ref://backstage-plugin-bar' },
      { package: 'ref://backstage-plugin-baz' },
      { package: 'oci://quay.io/rhdh/already-resolved@sha256:fff' },
    ];
    const includes: IncludePluginList[] = [
      [
        'dpdy.yaml',
        [
          {
            package: 'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123',
            enabled: false,
          },
          { package: './dynamic-plugins/dist/backstage-plugin-bar' },
        ],
      ],
      [
        'extra.yaml',
        [
          {
            package:
              'https://example.com/plugins/backstage-plugin-baz-1.2.3.tgz',
          },
        ],
      ],
    ];

    resolveRefPlugins(main, includes);

    expect(main[0]!.package).toBe(
      'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123',
    );
    expect(main[1]!.package).toBe(
      './dynamic-plugins/dist/backstage-plugin-bar',
    );
    expect(main[2]!.package).toBe(
      'https://example.com/plugins/backstage-plugin-baz-1.2.3.tgz',
    );
    expect(main[3]!.package).toBe(
      'oci://quay.io/rhdh/already-resolved@sha256:fff',
    );
  });

  it('throws on unknown plugin name', () => {
    const main: PluginSpec[] = [{ package: 'ref://unknown-plugin' }];
    const includes: IncludePluginList[] = [
      [
        'dpdy.yaml',
        [
          {
            package: 'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123',
          },
        ],
      ],
    ];
    expect(() => resolveRefPlugins(main, includes)).toThrow(
      "Cannot resolve ref:// reference: no plugin named 'unknown-plugin' found in included plugins",
    );
  });

  it('throws on empty ref', () => {
    const main: PluginSpec[] = [{ package: 'ref://' }];
    const includes: IncludePluginList[] = [['dpdy.yaml', []]];
    expect(() => resolveRefPlugins(main, includes)).toThrow(
      'Invalid ref:// reference: empty plugin name in ref://',
    );
  });

  it('resolves to the first match when duplicate names exist across includes', () => {
    const main: PluginSpec[] = [{ package: 'ref://backstage-plugin-foo' }];
    const includes: IncludePluginList[] = [
      [
        'dpdy.yaml',
        [
          {
            package: 'oci://quay.io/rhdh/backstage-plugin-foo@sha256:first',
          },
        ],
      ],
      [
        'extra.yaml',
        [
          {
            package: 'oci://quay.io/other/backstage-plugin-foo@sha256:second',
          },
        ],
      ],
    ];
    resolveRefPlugins(main, includes);
    expect(main[0]!.package).toBe(
      'oci://quay.io/rhdh/backstage-plugin-foo@sha256:first',
    );
  });
});
