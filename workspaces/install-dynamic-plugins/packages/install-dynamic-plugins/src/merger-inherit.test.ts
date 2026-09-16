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
import { mergePlugin, resolveInheritPackage } from './merger';
import type { Plugin, PluginMap } from './types';

const BASE_IMAGE = 'oci://quay.io/rhdh/backstage-plugin-catalog';
const REQUEST_IMAGE = 'oci://registry.redhat.io/rhdh/backstage-plugin-catalog';
const VERSION = '1.10.2';
const MAIN_FILE = 'main.yaml';
const INCLUDE_FILE = 'include.yaml';

async function seedInclude(
  all: PluginMap,
  plugin: Plugin,
  file = INCLUDE_FILE,
): Promise<void> {
  await mergePlugin(plugin, all, file, /* level */ 0);
}

function mergeMain(all: PluginMap, plugin: Plugin): Promise<void> {
  return mergePlugin(plugin, all, MAIN_FILE, /* level */ 1);
}

async function installErrorMessage(
  merge: () => Promise<unknown>,
): Promise<string> {
  try {
    await merge();
  } catch (err) {
    expect(err).toBeInstanceOf(InstallException);
    return err instanceof Error ? err.message : String(err);
  }
  throw new Error('expected the merge to throw an InstallException');
}

function syncInstallErrorMessage(run: () => unknown): string {
  try {
    run();
  } catch (err) {
    expect(err).toBeInstanceOf(InstallException);
    return err instanceof Error ? err.message : String(err);
  }
  throw new Error('expected the operation to throw an InstallException');
}

describe('mergePlugin — name-based OCI {{inherit}} lookup', () => {
  it('rejects {{inherit}} inside an included file', async () => {
    const all: PluginMap = {};

    const message = await installErrorMessage(() =>
      seedInclude(all, {
        package: `${BASE_IMAGE}:{{inherit}}!catalog-backend`,
      }),
    );

    expect(message).toContain(
      'Cannot use {{inherit}} in included plugin configuration',
    );
    expect(message).toContain(INCLUDE_FILE);
  });

  it('resolves across registries, then merges by the concrete package', async () => {
    const all: PluginMap = {};
    await seedInclude(all, {
      package: `${BASE_IMAGE}:${VERSION}!catalog-backend`,
      disabled: true,
      pluginConfig: { source: 'catalog' },
    });

    const override: Plugin = {
      package: `${REQUEST_IMAGE}:{{inherit}}!catalog-backend`,
      enabled: true,
      pluginConfig: { source: 'main' },
    };
    await mergeMain(all, override);

    const key = `${BASE_IMAGE}:!catalog-backend`;
    expect(Object.keys(all)).toEqual([key]);
    expect(override.package).toBe(`${BASE_IMAGE}:${VERSION}!catalog-backend`);
    expect(all[key]).toMatchObject({
      package: `${BASE_IMAGE}:${VERSION}!catalog-backend`,
      version: VERSION,
      enabled: true,
      pluginConfig: { source: 'main' },
      last_modified_level: 1,
    });
    expect(all[key]).not.toHaveProperty('disabled');
  });

  it('uses the included registry and path when the request omits a path', async () => {
    const all: PluginMap = {};
    await seedInclude(all, {
      package: `${BASE_IMAGE}:${VERSION}!catalog-backend`,
    });

    const override: Plugin = {
      package: `${REQUEST_IMAGE}:{{inherit}}`,
    };
    await mergeMain(all, override);

    expect(override.package).toBe(`${BASE_IMAGE}:${VERSION}!catalog-backend`);
  });

  it('preserves an explicit user plugin path like the operator', async () => {
    const all: PluginMap = {};
    await seedInclude(all, {
      package: `${BASE_IMAGE}:${VERSION}!catalog-backend`,
    });

    const override: Plugin = {
      package: `${REQUEST_IMAGE}:{{inherit}}!custom-path`,
    };
    await mergeMain(all, override);

    const customKey = `${BASE_IMAGE}:!custom-path`;
    expect(override.package).toBe(`${BASE_IMAGE}:${VERSION}!custom-path`);
    expect(all[customKey]).toMatchObject({
      package: `${BASE_IMAGE}:${VERSION}!custom-path`,
      version: VERSION,
      last_modified_level: 1,
    });
  });

  it('reports a missing same-named included plugin', async () => {
    const all: PluginMap = {};
    await seedInclude(all, {
      package: 'oci://quay.io/rhdh/different-plugin:1.0!different-plugin',
    });

    const message = await installErrorMessage(() =>
      mergeMain(all, { package: `${REQUEST_IMAGE}:{{inherit}}` }),
    );

    expect(message).toContain(
      "Cannot use {{inherit}} for 'backstage-plugin-catalog': no existing plugin configuration found",
    );
  });

  it('rejects ambiguous same-name candidates from different registries', () => {
    const first = `${BASE_IMAGE}:1.0!catalog-backend`;
    const second =
      'oci://registry.example.com/other/backstage-plugin-catalog:2.0!catalog-backend';
    const message = syncInstallErrorMessage(() =>
      resolveInheritPackage(`${REQUEST_IMAGE}:{{inherit}}`, [
        { package: first, sourceFile: 'first.yaml' },
        { package: second, sourceFile: 'second.yaml' },
      ]),
    );

    expect(message).toContain(first);
    expect(message).toContain('first.yaml');
    expect(message).toContain(second);
    expect(message).toContain('second.yaml');
  });

  it('requires a path when one image supplies several plugin entries', () => {
    const candidates = [
      { package: `${BASE_IMAGE}:1.0!plugin-a` },
      { package: `${BASE_IMAGE}:1.0!plugin-b` },
    ];

    expect(() =>
      resolveInheritPackage(`${REQUEST_IMAGE}:{{inherit}}`, candidates),
    ).toThrow(/Specify which plugin to inherit/);
  });

  it('uses an explicit path to select one entry from a multi-plugin image', () => {
    const resolved = resolveInheritPackage(
      `${REQUEST_IMAGE}:{{inherit}}!plugin-b`,
      [
        { package: `${BASE_IMAGE}:1.0!plugin-a` },
        { package: `${BASE_IMAGE}:2.0!plugin-b` },
      ],
    );

    expect(resolved).toBe(`${BASE_IMAGE}:2.0!plugin-b`);
  });
});

describe('mergePlugin — ordinary OCI identity remains concrete', () => {
  it('does not merge ordinary packages merely because their final names match', async () => {
    const all: PluginMap = {};
    await seedInclude(all, {
      package: `${BASE_IMAGE}:1.0!catalog-backend`,
    });
    await mergeMain(all, {
      package: `${REQUEST_IMAGE}:2.0!catalog-backend`,
    });

    expect(Object.keys(all).sort()).toEqual(
      [
        `${BASE_IMAGE}:!catalog-backend`,
        `${REQUEST_IMAGE}:!catalog-backend`,
      ].sort(),
    );
  });
});
