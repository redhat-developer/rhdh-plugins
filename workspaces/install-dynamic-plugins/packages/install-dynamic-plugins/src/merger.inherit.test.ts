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
import { mergePlugin } from './merger';
import type { PluginMap } from './types';

/**
 * Coverage for the `{{inherit}}` resolution in `mergeOciPlugin` /
 * `resolveInherit`.
 *
 * `merger-pre-merge.test.ts` also spells `{{inherit}}` in its fixtures, but
 * `preMergeOciDisabledState` never parses the tag — it only reads the registry
 * and the `!path` suffix — so those occurrences exercise none of this file's
 * behaviour.
 *
 * Every case below uses an explicit `!<plugin-path>` on the seed entries and a
 * path-less or explicitly-pathed `{{inherit}}` on the override, so no OCI image
 * cache (and therefore no skopeo call) is ever needed.
 */

const REGISTRY = 'oci://registry.example.com/plugin';
const KEY_A = `${REGISTRY}:!plugin-a`;
const KEY_B = `${REGISTRY}:!plugin-b`;

/** Version shipped by the include — the one `{{inherit}}` must adopt. */
const NEWER = '1.10.2';
/** An older sibling in the same image — must never be picked silently. */
const OLDER = '1.9.0';

async function seedInclude(
  all: PluginMap,
  pkg: string,
  file = 'include.yaml',
): Promise<void> {
  await mergePlugin({ package: pkg }, all, file, /* level */ 0);
}

describe('mergeOciPlugin — {{inherit}} with no resolvable base', () => {
  it('reports the missing base configuration when nothing from the image was merged', async () => {
    const all: PluginMap = {};
    const merge = () =>
      mergePlugin(
        { package: `${REGISTRY}:{{inherit}}` },
        all,
        'main.yaml',
        /* level */ 1,
      );

    await expect(merge()).rejects.toBeInstanceOf(InstallException);
    await expect(merge()).rejects.toThrow(
      `Cannot use {{inherit}} for ${REGISTRY}: no existing plugin configuration found.`,
    );
    await expect(merge()).rejects.toThrow(
      'Ensure a plugin from this image is defined in an included file with an explicit version.',
    );
    expect(all).toEqual({});
  });

  it('does not treat a plugin from a different image as a base', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `oci://other.example.com/plugin:${NEWER}!plugin-a`);

    await expect(
      mergePlugin(
        { package: `${REGISTRY}:{{inherit}}` },
        all,
        'main.yaml',
        /* level */ 1,
      ),
    ).rejects.toThrow(
      `Cannot use {{inherit}} for ${REGISTRY}: no existing plugin configuration found.`,
    );
    expect(Object.keys(all)).toEqual([
      'oci://other.example.com/plugin:!plugin-a',
    ]);
  });
});

describe('mergeOciPlugin — {{inherit}} matching several plugins of the same image', () => {
  async function seedTwoPlugins(): Promise<PluginMap> {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`, 'include-a.yaml');
    await seedInclude(all, `${REGISTRY}:${OLDER}!plugin-b`, 'include-b.yaml');
    return all;
  }

  it('lists every candidate and tells the user how to disambiguate', async () => {
    const all = await seedTwoPlugins();
    const merge = () =>
      mergePlugin(
        { package: `${REGISTRY}:{{inherit}}` },
        all,
        'main.yaml',
        /* level */ 1,
      );

    await expect(merge()).rejects.toBeInstanceOf(InstallException);
    await expect(merge()).rejects.toThrow(
      `Cannot use {{inherit}} for ${REGISTRY}: multiple plugins from this image are defined in the included files:`,
    );
    // Each candidate is rendered with the version it currently resolves to, so
    // the operator can see which one they would be inheriting.
    await expect(merge()).rejects.toThrow(`  - ${REGISTRY}:${NEWER}!plugin-a`);
    await expect(merge()).rejects.toThrow(`  - ${REGISTRY}:${OLDER}!plugin-b`);
    // The remediation hint is the part the operator actually acts on.
    await expect(merge()).rejects.toThrow(
      `Please specify which plugin configuration to inherit from using: ${REGISTRY}:{{inherit}}!<plugin_path>`,
    );
  });

  it('refuses to resolve rather than silently adopting one of the candidates', async () => {
    const all = await seedTwoPlugins();

    await expect(
      mergePlugin(
        { package: `${REGISTRY}:{{inherit}}` },
        all,
        'main.yaml',
        /* level */ 1,
      ),
      // Asserting the message, not just the type: dropping this guard makes the
      // merge fail later with the "no resolved tag or digest" error instead,
      // which a bare `toThrow()` would happily accept.
    ).rejects.toThrow('multiple plugins from this image are defined');

    // Nothing was resolved: no new key, and both candidates keep the version
    // and precedence level their include gave them. An ambiguous match that
    // picked `matches[0]` would be free to land on the older sibling.
    expect(Object.keys(all)).toEqual([KEY_A, KEY_B]);
    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all[KEY_B]?.version).toBe(OLDER);
    expect(all[KEY_A]?.last_modified_level).toBe(0);
    expect(all[KEY_B]?.last_modified_level).toBe(0);
  });
});

describe('mergeOciPlugin — {{inherit}} matching a base without a version', () => {
  it('reports the broken invariant instead of inheriting `undefined`', async () => {
    // `mergeOciPlugin` always assigns `plugin.version` before storing a plugin,
    // so this state is not reachable through the merger itself — hence the
    // `Internal:` prefix. The map is seeded by hand to exercise the guard.
    const all: PluginMap = {
      [KEY_A]: { package: `${REGISTRY}:${NEWER}!plugin-a` },
    };
    const merge = () =>
      mergePlugin(
        { package: `${REGISTRY}:{{inherit}}` },
        all,
        'main.yaml',
        /* level */ 1,
      );

    await expect(merge()).rejects.toBeInstanceOf(InstallException);
    await expect(merge()).rejects.toThrow(
      `Internal: inherited plugin ${KEY_A} has no version`,
    );
  });
});

describe('mergeOciPlugin — {{inherit}} with an explicit !plugin-path', () => {
  it('reports the unresolved tag when the referenced path was never merged', async () => {
    const all: PluginMap = {};
    const pkg = `${REGISTRY}:{{inherit}}!plugin-a`;
    const merge = () =>
      mergePlugin({ package: pkg }, all, 'main.yaml', /* level */ 1);

    await expect(merge()).rejects.toBeInstanceOf(InstallException);
    await expect(merge()).rejects.toThrow(
      '{{inherit}} tag is set and there is currently no resolved tag or digest',
    );
    // The package and the config file are named so the operator can find the
    // offending entry without reading the whole config.
    await expect(merge()).rejects.toThrow(`for ${pkg} in main.yaml.`);
    expect(all).toEqual({});
  });

  it('keeps the base version and package when the referenced path exists', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    await mergePlugin(
      {
        package: `${REGISTRY}:{{inherit}}!plugin-a`,
        pluginConfig: { app: { title: 'overridden' } },
      },
      all,
      'main.yaml',
      /* level */ 1,
    );

    // The `{{inherit}}` literal must never reach the merged record.
    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all[KEY_A]?.package).toBe(`${REGISTRY}:${NEWER}!plugin-a`);
    expect(all[KEY_A]?.pluginConfig).toEqual({ app: { title: 'overridden' } });
    expect(all[KEY_A]?.last_modified_level).toBe(1);
    expect(Object.keys(all)).toEqual([KEY_A]);
  });
});

describe('mergeOciPlugin — {{inherit}} resolving against a single base', () => {
  it('adopts the version and plugin path of the only candidate', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    const plugin = { package: `${REGISTRY}:{{inherit}}`, disabled: true };
    await mergePlugin(plugin, all, 'main.yaml', /* level */ 1);

    // The override is rewritten in place so downstream consumers (hashing,
    // download) see a concrete reference rather than the `{{inherit}}` literal.
    expect(plugin.package).toBe(`${REGISTRY}:${NEWER}!plugin-a`);
    // It folds into the existing entry instead of creating a path-less one.
    expect(Object.keys(all)).toEqual([KEY_A]);
    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all[KEY_A]?.package).toBe(`${REGISTRY}:${NEWER}!plugin-a`);
    expect(all[KEY_A]?.disabled).toBe(true);
    expect(all[KEY_A]?.last_modified_level).toBe(1);
  });

  it('logs the version and path it inherited', async () => {
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    try {
      const all: PluginMap = {};
      await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);
      await mergePlugin(
        { package: `${REGISTRY}:{{inherit}}` },
        all,
        'main.yaml',
        /* level */ 1,
      );

      const out = write.mock.calls.map(args => String(args[0])).join('\n');
      expect(out).toContain(
        `Inheriting version \`${NEWER}\` and plugin path \`plugin-a\` for ${KEY_A}`,
      );
    } finally {
      write.mockRestore();
    }
  });

  it('never resolves to a version older than the one the include provides', async () => {
    const all: PluginMap = {};
    // A same-named plugin path in an unrelated image, at an older version, must
    // not influence the resolution (RHDHBUGS-3503 shipped older versions than
    // the previous release through this path).
    await seedInclude(
      all,
      `oci://other.example.com/plugin:${OLDER}!plugin-a`,
      'include-other.yaml',
    );
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    await mergePlugin(
      { package: `${REGISTRY}:{{inherit}}` },
      all,
      'main.yaml',
      /* level */ 1,
    );

    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all['oci://other.example.com/plugin:!plugin-a']?.version).toBe(
      OLDER,
    );
  });

  it('lets a higher-precedence explicit version override, unlike {{inherit}}', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    // The main config outranks the includes, so an explicit tag there is an
    // intentional override — the case `{{inherit}}` deliberately opts out of.
    await mergePlugin(
      { package: `${REGISTRY}:2.0.0!plugin-a` },
      all,
      'main.yaml',
      /* level */ 1,
    );

    expect(all[KEY_A]?.version).toBe('2.0.0');
    expect(all[KEY_A]?.package).toBe(`${REGISTRY}:2.0.0!plugin-a`);
  });
});
