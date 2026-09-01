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
import type { Plugin, PluginMap } from './types';

/**
 * Coverage for the `{{inherit}}` resolution in `mergeOciPlugin` /
 * `resolveInherit`.
 *
 * `merger-pre-merge.test.ts` also spells `{{inherit}}` in its fixtures, but
 * `preMergeOciDisabledState` never parses the tag — it only reads the registry
 * and the `!path` suffix — so those occurrences exercise none of this file's
 * behaviour.
 *
 * Every package string below either carries an explicit `!<plugin-path>` or is
 * a path-less `{{inherit}}`. Both return from `ociPluginKey` before
 * `autoDetectPluginPath` is reached, so no OCI image cache — and therefore no
 * skopeo call — is ever needed.
 */

const REGISTRY = 'oci://registry.example.com/plugin';
const OTHER_REGISTRY = 'oci://other.example.com/plugin';
const KEY_A = `${REGISTRY}:!plugin-a`;
const KEY_B = `${REGISTRY}:!plugin-b`;
const OTHER_KEY_A = `${OTHER_REGISTRY}:!plugin-a`;

const MAIN_FILE = 'main.yaml';
const INCLUDE_FILE = 'include.yaml';

/** Version shipped by the include — the one `{{inherit}}` must adopt. */
const NEWER = '1.10.2';
/** An older sibling in the same image — must never be picked silently. */
const OLDER = '1.9.0';

/** Merge an include entry (level 0), the lower-precedence source. */
async function seedInclude(
  all: PluginMap,
  pkg: string,
  file = INCLUDE_FILE,
): Promise<void> {
  await mergePlugin({ package: pkg }, all, file, /* level */ 0);
}

/** Merge an entry from the main config (level 1), which outranks the includes. */
function mergeMain(all: PluginMap, plugin: Plugin): Promise<void> {
  return mergePlugin(plugin, all, MAIN_FILE, /* level */ 1);
}

/**
 * Run `merge`, assert it failed with an `InstallException`, and hand back the
 * message so several parts of it can be asserted without merging again —
 * re-running would assert later parts against a mutated `allPlugins`.
 */
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

describe('mergePlugin — OCI {{inherit}} with no resolvable base', () => {
  it('reports the missing base configuration when nothing from the image was merged', async () => {
    const all: PluginMap = {};

    const message = await installErrorMessage(() =>
      mergeMain(all, { package: `${REGISTRY}:{{inherit}}` }),
    );

    expect(message).toContain(
      `Cannot use {{inherit}} for ${REGISTRY}: no existing plugin configuration found.`,
    );
    expect(message).toContain(
      'Ensure a plugin from this image is defined in an included file with an explicit version.',
    );
    expect(all).toEqual({});
  });

  it('does not treat a plugin from a different image as a base', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${OTHER_REGISTRY}:${NEWER}!plugin-a`);

    const message = await installErrorMessage(() =>
      mergeMain(all, { package: `${REGISTRY}:{{inherit}}` }),
    );

    expect(message).toContain(
      `Cannot use {{inherit}} for ${REGISTRY}: no existing plugin configuration found.`,
    );
    expect(Object.keys(all)).toEqual([OTHER_KEY_A]);
  });
});

describe('mergePlugin — OCI {{inherit}} matching several plugins of the same image', () => {
  async function seedTwoPlugins(): Promise<PluginMap> {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`, 'include-a.yaml');
    await seedInclude(all, `${REGISTRY}:${OLDER}!plugin-b`, 'include-b.yaml');
    return all;
  }

  it('lists every candidate and tells the user how to disambiguate', async () => {
    const all = await seedTwoPlugins();

    const message = await installErrorMessage(() =>
      mergeMain(all, { package: `${REGISTRY}:{{inherit}}` }),
    );

    expect(message).toContain(
      `Cannot use {{inherit}} for ${REGISTRY}: multiple plugins from this image are defined in the included files:`,
    );
    // Each candidate is rendered with the version it currently resolves to, so
    // the operator can see which one they would be inheriting.
    expect(message).toContain(`  - ${REGISTRY}:${NEWER}!plugin-a`);
    expect(message).toContain(`  - ${REGISTRY}:${OLDER}!plugin-b`);
    // The remediation hint is the part the operator actually acts on.
    expect(message).toContain(
      `Please specify which plugin configuration to inherit from using: ${REGISTRY}:{{inherit}}!<plugin_path>`,
    );
  });

  it('refuses to resolve rather than silently adopting the older candidate', async () => {
    const all = await seedTwoPlugins();

    // This is the guard behind "{{inherit}} never resolves to a version older
    // than the include provides": with two candidates there is no defensible
    // answer, and picking `matches[0]` would be free to land on OLDER.
    //
    // Asserting the message, not just the type: dropping this guard makes the
    // merge fail later with the "no resolved tag or digest" error instead,
    // which a bare `toThrow()` would happily accept.
    const message = await installErrorMessage(() =>
      mergeMain(all, { package: `${REGISTRY}:{{inherit}}` }),
    );
    expect(message).toContain('multiple plugins from this image are defined');

    // Nothing was resolved: no new key, and both candidates keep the version
    // and precedence level their include gave them.
    expect(Object.keys(all)).toEqual([KEY_A, KEY_B]);
    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all[KEY_B]?.version).toBe(OLDER);
    expect(all[KEY_A]?.last_modified_level).toBe(0);
    expect(all[KEY_B]?.last_modified_level).toBe(0);
  });
});

describe('mergePlugin — OCI {{inherit}} matching a base without a version', () => {
  it('reports the broken invariant instead of inheriting `undefined`', async () => {
    // `mergeOciPlugin` always assigns `plugin.version` before storing a plugin,
    // so this state is not reachable through the merger itself — hence the
    // `Internal:` prefix. The map is seeded by hand to exercise the guard.
    const all: PluginMap = {
      [KEY_A]: { package: `${REGISTRY}:${NEWER}!plugin-a` },
    };

    const message = await installErrorMessage(() =>
      mergeMain(all, { package: `${REGISTRY}:{{inherit}}` }),
    );

    expect(message).toContain(
      `Internal: inherited plugin ${KEY_A} has no version`,
    );
  });
});

describe('mergePlugin — OCI {{inherit}} with an explicit !plugin-path', () => {
  it('reports the unresolved tag when the referenced path was never merged', async () => {
    const all: PluginMap = {};
    const pkg = `${REGISTRY}:{{inherit}}!plugin-a`;

    const message = await installErrorMessage(() =>
      mergeMain(all, { package: pkg }),
    );

    expect(message).toContain(
      '{{inherit}} tag is set and there is currently no resolved tag or digest',
    );
    // The package and the config file are named so the operator can find the
    // offending entry without reading the whole config.
    expect(message).toContain(`for ${pkg} in ${MAIN_FILE}.`);
    expect(all).toEqual({});
  });

  it('keeps the base version and package when the referenced path exists', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    await mergeMain(all, {
      package: `${REGISTRY}:{{inherit}}!plugin-a`,
      pluginConfig: { app: { title: 'overridden' } },
    });

    // The `{{inherit}}` literal must never reach the merged record.
    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all[KEY_A]?.package).toBe(`${REGISTRY}:${NEWER}!plugin-a`);
    expect(all[KEY_A]?.pluginConfig).toEqual({ app: { title: 'overridden' } });
    expect(all[KEY_A]?.last_modified_level).toBe(1);
    expect(Object.keys(all)).toEqual([KEY_A]);
  });
});

describe('mergePlugin — OCI {{inherit}} resolving against a single base', () => {
  it('adopts the version and plugin path of the only candidate', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    const plugin: Plugin = {
      package: `${REGISTRY}:{{inherit}}`,
      disabled: true,
    };
    await mergeMain(all, plugin);

    // `resolveInherit` documents that it rewrites `plugin.package` in place,
    // and this is the only assertion of that contract. It is the override
    // object that gets rewritten, not the merged record: the entry kept in
    // `allPlugins` is the include's own, whose package was already concrete
    // (asserted below). `installer.ts` reads only `Object.values(allPlugins)`
    // afterwards, so nothing downstream depends on this rewrite today.
    expect(plugin.package).toBe(`${REGISTRY}:${NEWER}!plugin-a`);
    // It folds into the existing entry instead of creating a path-less one.
    // No assertion on the merged `package` here: it is the include's own string
    // and no mutation of the inherit path can change it, so asserting it would
    // only restate the fixture. The contract that an override must not clobber
    // it is enforced by the explicit-!path test above, which does catch that.
    expect(Object.keys(all)).toEqual([KEY_A]);
    expect(all[KEY_A]?.version).toBe(NEWER);
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
      await mergeMain(all, { package: `${REGISTRY}:{{inherit}}` });

      const out = write.mock.calls.map(args => String(args[0])).join('\n');
      expect(out).toContain(
        `Inheriting version \`${NEWER}\` and plugin path \`plugin-a\` for ${KEY_A}`,
      );
    } finally {
      write.mockRestore();
    }
  });

  it('ignores a same-named plugin path belonging to a different image', async () => {
    const all: PluginMap = {};
    // Candidates are matched on the full registry, not on the plugin path, so
    // an unrelated image publishing `plugin-a` must not enter the selection.
    await seedInclude(
      all,
      `${OTHER_REGISTRY}:${OLDER}!plugin-a`,
      'include-other.yaml',
    );
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    await mergeMain(all, { package: `${REGISTRY}:{{inherit}}` });

    expect(all[KEY_A]?.version).toBe(NEWER);
    expect(all[OTHER_KEY_A]?.version).toBe(OLDER);
  });
});

describe('mergePlugin — OCI explicit version override', () => {
  it('lets the main config outrank an include, unlike {{inherit}}', async () => {
    const all: PluginMap = {};
    await seedInclude(all, `${REGISTRY}:${NEWER}!plugin-a`);

    // The main config outranks the includes, so an explicit tag there is an
    // intentional override — the case `{{inherit}}` deliberately opts out of.
    await mergeMain(all, { package: `${REGISTRY}:2.0.0!plugin-a` });

    expect(all[KEY_A]?.version).toBe('2.0.0');
    expect(all[KEY_A]?.package).toBe(`${REGISTRY}:2.0.0!plugin-a`);
  });
});
