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
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { main } from './installer';
import { log } from './log';
import type { PluginSpec } from './types';

jest.mock('./log', () => ({ log: jest.fn() }));
const warnings = () =>
  (log as jest.Mock).mock.calls
    .map(([message]: [string]) => message)
    .filter((message: string) => message.includes('deprecated'));

describe('dynamic-plugins.yaml disabled deprecation', () => {
  let dir: string;
  const originalCwd = process.cwd();
  const originalCatalogIndex = process.env.CATALOG_INDEX_IMAGE;
  const originalExtraIndexes = process.env.EXTRA_CATALOG_INDEX_IMAGES;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dp-deprecation-'));
    process.chdir(dir);
    delete process.env.CATALOG_INDEX_IMAGE;
    delete process.env.EXTRA_CATALOG_INDEX_IMAGES;
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (originalCatalogIndex === undefined)
      delete process.env.CATALOG_INDEX_IMAGE;
    else process.env.CATALOG_INDEX_IMAGE = originalCatalogIndex;
    if (originalExtraIndexes === undefined)
      delete process.env.EXTRA_CATALOG_INDEX_IMAGES;
    else process.env.EXTRA_CATALOG_INDEX_IMAGES = originalExtraIndexes;
    jest.restoreAllMocks();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('warns once per raw entry, including an overridden include and a filtered OCI entry', async () => {
    const included: PluginSpec[] = [
      { package: './overridden-local', disabled: true },
      { package: 'oci://example.com/unused:1!plugin', disabled: true },
    ];
    await fs.writeFile(
      path.join(dir, 'included.yaml'),
      JSON.stringify({ plugins: included }),
    );
    const plugins: PluginSpec[] = [
      { package: './overridden-local', enabled: true },
      { package: './disabled-false-local', disabled: false },
      { package: './both-local', enabled: false, disabled: false },
      { package: './enabled-only-local', enabled: false },
      { package: './neither-local' },
    ];
    await fs.writeFile(
      path.join(dir, 'dynamic-plugins.yaml'),
      JSON.stringify({ includes: ['included.yaml'], plugins }),
    );
    // Missing local paths skip installation, so this exercises startup without
    // npm, OCI downloads, or a live registry.
    await main([path.join(dir, 'dynamic-plugins-root')]);
    expect(process.exit).toHaveBeenCalledWith(0);

    expect(warnings()).toHaveLength(4);
    expect(
      warnings().filter(message => message.includes('./overridden-local')),
    ).toHaveLength(1);
    expect(
      warnings().filter(message =>
        message.includes('oci://example.com/unused:1!plugin'),
      ),
    ).toHaveLength(1);
    expect(
      warnings().filter(message => message.includes('./disabled-false-local')),
    ).toHaveLength(1);
    expect(
      warnings().filter(message => message.includes('./both-local')),
    ).toHaveLength(1);
    expect(
      warnings().some(message => message.includes('./enabled-only-local')),
    ).toBe(false);
    expect(
      warnings().some(message => message.includes('./neither-local')),
    ).toBe(false);
  });
});
