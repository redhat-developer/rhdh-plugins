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
import { resolveInheritPlugins } from './installer';
import {
  filterDisabledOciPlugins,
  mergePlugin,
  preMergeOciDisabledState,
} from './merger';
import type { IncludePluginList, PluginMap, PluginSpec } from './types';

const BASE_IMAGE = 'oci://quay.io/rhdh/backstage-plugin-catalog';
const REQUEST_IMAGE = 'oci://registry.redhat.io/rhdh/backstage-plugin-catalog';

describe('resolveInheritPlugins', () => {
  it('supports the complete resolve, filter, and merge flow', async () => {
    const includes: IncludePluginList[] = [
      [
        'dpdy.yaml',
        [
          {
            package: `${BASE_IMAGE}:1.0!catalog-backend`,
            enabled: false,
            pluginConfig: { source: 'catalog' },
          },
        ],
      ],
    ];
    const main: PluginSpec[] = [
      {
        package: `${REQUEST_IMAGE}:{{inherit}}!catalog-backend`,
        enabled: true,
        pluginConfig: { source: 'main' },
      },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);
    const disabled = preMergeOciDisabledState(
      includes,
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    const all: PluginMap = {};
    for (const plugin of filterDisabledOciPlugins(includes[0]![1], disabled)) {
      await mergePlugin(plugin, all, 'dpdy.yaml', 0);
    }
    for (const plugin of filterDisabledOciPlugins(main, disabled)) {
      await mergePlugin(plugin, all, 'dynamic-plugins.yaml', 1);
    }

    expect(all[`${BASE_IMAGE}:!catalog-backend`]).toMatchObject({
      package: `${BASE_IMAGE}:1.0!catalog-backend`,
      enabled: true,
      pluginConfig: { source: 'main' },
      last_modified_level: 1,
    });
  });

  it('resolves before disabled filtering so the main entry can re-enable its base', () => {
    const includes: IncludePluginList[] = [
      ['dpdy.yaml', [{ package: `${BASE_IMAGE}:1.0`, enabled: false }]],
    ];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}`, enabled: true },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(`${BASE_IMAGE}:1.0`);
    const disabled = preMergeOciDisabledState(
      includes,
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    expect(disabled.has(BASE_IMAGE)).toBe(false);
  });

  it('leaves an unresolved disabled pathless entry for filtering', () => {
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}`, disabled: true },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    expect(() => resolveInheritPlugins(main, [])).not.toThrow();
    expect(main[0]!.package).toBe(`${REQUEST_IMAGE}:{{inherit}}`);

    const disabled = preMergeOciDisabledState(
      [],
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    expect(filterDisabledOciPlugins(main, disabled)).toEqual([]);
  });

  it('preserves the existing error for a disabled unresolved explicit path', () => {
    const main: PluginSpec[] = [
      {
        package: `${REQUEST_IMAGE}:{{inherit}}!missing-path`,
        disabled: true,
      },
    ];

    expect(() => resolveInheritPlugins(main, [])).toThrow(
      /no existing plugin configuration found/,
    );
  });

  it('resolves a disabled pathless entry before disabling a cross-registry image', () => {
    const include: PluginSpec[] = [
      { package: `${BASE_IMAGE}:1.0!catalog-backend` },
    ];
    const includes: IncludePluginList[] = [['dpdy.yaml', include]];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}`, disabled: true },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(`${BASE_IMAGE}:1.0`);
    const disabled = preMergeOciDisabledState(
      includes,
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    expect(filterDisabledOciPlugins(include, disabled)).toEqual([]);
    expect(filterDisabledOciPlugins(main, disabled)).toEqual([]);
  });

  it('disables a cross-registry multi-plugin image with a pathless entry', () => {
    const include: PluginSpec[] = [
      { package: `${BASE_IMAGE}:1.0!plugin-a` },
      { package: `${BASE_IMAGE}:1.0!plugin-b` },
    ];
    const includes: IncludePluginList[] = [['dpdy.yaml', include]];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}`, enabled: false },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(`${BASE_IMAGE}:1.0`);
    const disabled = preMergeOciDisabledState(
      includes,
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    expect(filterDisabledOciPlugins(include, disabled)).toEqual([]);
    expect(filterDisabledOciPlugins(main, disabled)).toEqual([]);
  });

  it('disables cross-registry candidates with different versions and paths', () => {
    const include: PluginSpec[] = [
      { package: `${BASE_IMAGE}:1.0!plugin-a` },
      { package: `${BASE_IMAGE}:2.0!plugin-b` },
    ];
    const includes: IncludePluginList[] = [['dpdy.yaml', include]];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}`, disabled: true },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(`${BASE_IMAGE}:1.0`);
    const disabled = preMergeOciDisabledState(
      includes,
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    expect(filterDisabledOciPlugins(include, disabled)).toEqual([]);
    expect(filterDisabledOciPlugins(main, disabled)).toEqual([]);
  });

  it('prefers an enabled include over a disabled same-name candidate', () => {
    const enabled = `${BASE_IMAGE}:1.0!catalog-backend`;
    const includes: IncludePluginList[] = [
      [
        'dpdy.yaml',
        [
          {
            package:
              'oci://mirror.example.com/rhdh/backstage-plugin-catalog:2.0!catalog-backend',
            disabled: true,
          },
          { package: enabled },
        ],
      ],
    ];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}!catalog-backend` },
    ];

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(enabled);
  });

  it('allows repeated disabled catalog rows to supply one inheritance base', async () => {
    const catalogPackage = `${BASE_IMAGE}:1.0!catalog-backend`;
    const include: PluginSpec[] = [
      { package: catalogPackage, disabled: true },
      { package: catalogPackage, disabled: true },
    ];
    const includes: IncludePluginList[] = [['dpdy.yaml', include]];
    const main: PluginSpec[] = [
      {
        package: `${REQUEST_IMAGE}:{{inherit}}!catalog-backend`,
        enabled: true,
      },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);
    const disabled = preMergeOciDisabledState(
      includes,
      main,
      'dynamic-plugins.yaml',
      declaredPackages,
    );
    const all: PluginMap = {};
    for (const plugin of filterDisabledOciPlugins(include, disabled)) {
      await mergePlugin(plugin, all, 'dpdy.yaml', 0);
    }
    for (const plugin of filterDisabledOciPlugins(main, disabled)) {
      await mergePlugin(plugin, all, 'dynamic-plugins.yaml', 1);
    }

    expect(Object.keys(all)).toEqual([`${BASE_IMAGE}:!catalog-backend`]);
    expect(all[`${BASE_IMAGE}:!catalog-backend`]).toMatchObject({
      package: catalogPackage,
      enabled: true,
      last_modified_level: 1,
    });
  });

  it('logs the concrete package selected during production pre-resolution', () => {
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    try {
      const includes: IncludePluginList[] = [
        ['dpdy.yaml', [{ package: `${BASE_IMAGE}:1.0!catalog-backend` }]],
      ];
      const main: PluginSpec[] = [
        { package: `${REQUEST_IMAGE}:{{inherit}}!catalog-backend` },
      ];

      resolveInheritPlugins(main, includes);

      const output = write.mock.calls.map(args => String(args[0])).join('\n');
      expect(output).toContain(
        `Resolved {{inherit}} plugin '${REQUEST_IMAGE}:{{inherit}}!catalog-backend' to '${BASE_IMAGE}:1.0!catalog-backend'`,
      );
    } finally {
      write.mockRestore();
    }
  });

  it('keeps main configuration fields while applying its explicit path', () => {
    const includes: IncludePluginList[] = [
      ['dpdy.yaml', [{ package: `${BASE_IMAGE}:1.0!catalog-backend` }]],
    ];
    const main: PluginSpec[] = [
      {
        package: `${REQUEST_IMAGE}:{{inherit}}!custom-path`,
        enabled: true,
        pluginConfig: { catalog: { enabled: true } },
      },
    ];

    resolveInheritPlugins(main, includes);

    expect(main[0]).toEqual({
      package: `${BASE_IMAGE}:1.0!custom-path`,
      enabled: true,
      pluginConfig: { catalog: { enabled: true } },
    });
  });

  it('leaves ordinary OCI packages unchanged', () => {
    const includes: IncludePluginList[] = [['dpdy.yaml', []]];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:2.0!catalog-backend` },
    ];

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(`${REQUEST_IMAGE}:2.0!catalog-backend`);
  });

  it('validates main name collisions against packages declared by the user', () => {
    const includes: IncludePluginList[] = [
      ['dpdy.yaml', [{ package: `${BASE_IMAGE}:1.0!plugin-a` }]],
    ];
    const main: PluginSpec[] = [
      { package: `${REQUEST_IMAGE}:{{inherit}}!plugin-a` },
      { package: `${REQUEST_IMAGE}:2.0!plugin-b` },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);

    expect(main[0]!.package).toBe(`${BASE_IMAGE}:1.0!plugin-a`);
    expect(() =>
      preMergeOciDisabledState(
        includes,
        main,
        'dynamic-plugins.yaml',
        declaredPackages,
      ),
    ).not.toThrow();
  });

  it('still rejects collisions between different user-declared registries', () => {
    const includes: IncludePluginList[] = [
      ['dpdy.yaml', [{ package: `${BASE_IMAGE}:1.0!plugin-a` }]],
    ];
    const main: PluginSpec[] = [
      {
        package:
          'oci://request.example.com/rhdh/backstage-plugin-catalog:{{inherit}}!plugin-a',
      },
      { package: `${REQUEST_IMAGE}:2.0!plugin-b` },
    ];
    const declaredPackages = main.map(plugin => plugin.package);

    resolveInheritPlugins(main, includes);

    expect(() =>
      preMergeOciDisabledState(
        includes,
        main,
        'dynamic-plugins.yaml',
        declaredPackages,
      ),
    ).toThrow(/both resolve to the plugin name 'backstage-plugin-catalog'/);
  });
});
