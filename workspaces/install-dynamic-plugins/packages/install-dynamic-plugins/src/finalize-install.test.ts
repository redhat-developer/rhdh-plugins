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
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { finalizeInstall } from './index';
import { GLOBAL_CONFIG_FILENAME } from './types';

describe('finalizeInstall', () => {
  let root: string;
  let globalConfigFile: string;
  let stdoutSpy: jest.SpyInstance<
    ReturnType<typeof process.stdout.write>,
    Parameters<typeof process.stdout.write>
  >;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'finalize-'));
    globalConfigFile = join(root, GLOBAL_CONFIG_FILENAME);
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    rmSync(root, { recursive: true, force: true });
  });

  it('writes the global config and removes obsolete plugin dirs on success', async () => {
    const obsoleteDir = join(root, 'obsolete-plugin');
    mkdirSync(obsoleteDir);
    writeFileSync(
      join(obsoleteDir, 'dynamic-plugin-config.hash'),
      'stale-hash',
    );
    const installed = new Map<string, string>([
      ['stale-hash', 'obsolete-plugin'],
    ]);

    const code = await finalizeInstall(
      [],
      globalConfigFile,
      { dynamicPlugins: { rootDirectory: 'dynamic-plugins-root' } },
      root,
      installed,
    );

    expect(code).toBe(0);
    expect(existsSync(globalConfigFile)).toBe(true);
    expect(readFileSync(globalConfigFile, 'utf8')).toContain(
      'rootDirectory: dynamic-plugins-root',
    );
    expect(existsSync(obsoleteDir)).toBe(false);
  });

  it('skips the config write and cleanup when errors were collected', async () => {
    const existingDir = join(root, 'keep-me');
    mkdirSync(existingDir);
    writeFileSync(
      join(existingDir, 'dynamic-plugin-config.hash'),
      'prior-hash',
    );
    const sentinel =
      'dynamicPlugins:\n  rootDirectory: dynamic-plugins-root\n# previous run\n';
    writeFileSync(globalConfigFile, sentinel);
    const installed = new Map<string, string>([['prior-hash', 'keep-me']]);

    const code = await finalizeInstall(
      ['oci://bogus/image:tag: connection refused'],
      globalConfigFile,
      { dynamicPlugins: { rootDirectory: 'dynamic-plugins-root' } },
      root,
      installed,
    );

    expect(code).toBe(1);
    // Previous config on disk must be preserved untouched.
    expect(readFileSync(globalConfigFile, 'utf8')).toBe(sentinel);
    // Previously-installed plugin dir must not be cleaned up.
    expect(existsSync(existingDir)).toBe(true);

    const logged = stdoutSpy.mock.calls.map(c => String(c[0])).join('');
    expect(logged).toContain('1 plugin(s) failed');
    expect(logged).toContain('oci://bogus/image:tag: connection refused');
    expect(logged).toContain(
      `Skipping ${GLOBAL_CONFIG_FILENAME} write and cleanup`,
    );
  });

  it('does not create the config file on error when no previous run exists', async () => {
    const code = await finalizeInstall(
      ['npm:broken-plugin: integrity mismatch'],
      globalConfigFile,
      { dynamicPlugins: { rootDirectory: 'dynamic-plugins-root' } },
      root,
      new Map(),
    );

    expect(code).toBe(1);
    expect(existsSync(globalConfigFile)).toBe(false);
  });
});
