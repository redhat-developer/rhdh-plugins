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
import { CONFIG_HASH_FILE } from './types';

jest.mock('./log', () => ({ log: jest.fn() }));

// RHDHBUGS-1573: a PVC-backed dynamic-plugins-root carries `lost+found`
// (root-owned, mode 0700). The installed-plugin scan must skip it.
describe('dynamic-plugins-root with unexpected entries', () => {
  let dir: string;
  let root: string;
  const originalCwd = process.cwd();
  const originalCatalogIndex = process.env.CATALOG_INDEX_IMAGE;
  const originalExtraIndexes = process.env.EXTRA_CATALOG_INDEX_IMAGES;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dp-root-entries-'));
    root = path.join(dir, 'dynamic-plugins-root');
    process.chdir(dir);
    delete process.env.CATALOG_INDEX_IMAGE;
    delete process.env.EXTRA_CATALOG_INDEX_IMAGES;
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await fs.writeFile(
      path.join(dir, 'dynamic-plugins.yaml'),
      JSON.stringify({ plugins: [] }),
    );
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
    await fs.chmod(path.join(root, 'lost+found'), 0o755).catch(() => undefined);
    await fs.rm(dir, { recursive: true, force: true });
  });

  // 0o000 only differs from 0o755 for a non-root user (EACCES vs ENOENT).
  it.each([0o755, 0o000])(
    'skips lost+found (mode %o) and a stray file while removing an obsolete plugin',
    async mode => {
      await fs.mkdir(path.join(root, 'lost+found'), { recursive: true });
      await fs.chmod(path.join(root, 'lost+found'), mode);
      await fs.writeFile(path.join(root, 'stray.txt'), 'x');
      await fs.mkdir(path.join(root, 'obsolete-plugin'));
      await fs.writeFile(
        path.join(root, 'obsolete-plugin', CONFIG_HASH_FILE),
        'abc123\n',
      );

      await main([root]);

      expect(process.exit).toHaveBeenCalledWith(0);
      expect((await fs.readdir(root)).sort()).toEqual(
        ['app-config.dynamic-plugins.yaml', 'lost+found', 'stray.txt'].sort(),
      );
    },
  );
});
