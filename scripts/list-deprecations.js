#!/usr/bin/env node
/*
 * Copyright The Backstage Authors
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

import _ from 'lodash';
import fs from 'fs-extra';
import { glob } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { getPackages } from '@manypkg/get-packages';
import { listWorkspaces } from './list-workspaces.js';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const execFile = promisify(execFileCb);

const WORKER_COUNT = 16;
const deprecatedPattern = /@deprecated|DEPRECATION/;

class ReleaseProvider {
  cache = new Map();

  constructor(rootPath) {
    this.rootPath = rootPath;
  }

  async lookup(commitSha, packageDir) {
    const key = commitSha + packageDir;

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const pkgJsonPath = relative(
      this.rootPath,
      join(this.rootPath, packageDir, 'package.json'),
    );
    const pkgJson = await fs.readJson(
      join(this.rootPath, packageDir, 'package.json'),
    );
    const packageName = pkgJson.name;

    const releasePromise = Promise.resolve().then(async () => {
      const { stdout: tagOutput } = await execFile('git', [
        'tag',
        '--contains',
        commitSha,
      ]);

      const releases = tagOutput
        .split('\n')
        .filter(Boolean)
        .filter(tag => tag.includes(packageName));

      for (const release of releases) {
        let oldVersion;
        let newVersion;

        try {
          const { stdout: content } = await execFile('git', [
            'show',
            `${release}^:${pkgJsonPath}`,
          ]);
          oldVersion = JSON.parse(content).version;
        } catch {
          /* */
        }
        try {
          const { stdout: content } = await execFile('git', [
            'show',
            `${release}:${pkgJsonPath}`,
          ]);
          newVersion = JSON.parse(content).version;
        } catch {
          /* */
        }

        if (oldVersion !== newVersion) {
          return release;
        }
      }
      return undefined;
    });

    this.cache.set(key, releasePromise);
    return releasePromise;
  }
}

async function getPackageDirs(rootPath, args) {
  const workspaceFilters = args
    .map(arg => arg.replace(/^workspaces\//, '').split('/')[0])
    .filter(Boolean);
  const workspaces =
    workspaceFilters.length > 0 ? workspaceFilters : await listWorkspaces();

  const packageDirs = [];
  for (const workspace of workspaces) {
    const workspacePath = join(rootPath, 'workspaces', workspace);
    if (!(await fs.pathExists(workspacePath))) {
      continue;
    }

    const { packages } = await getPackages(workspacePath);
    for (const pkg of packages) {
      packageDirs.push(relative(rootPath, pkg.dir));
    }
  }

  return packageDirs;
}

async function main() {
  const args = process.argv.slice(2);
  const rootPath = resolve(__dirname, '..');
  const packageDirQueue = await getPackageDirs(rootPath, args);

  const fileQueue = [];
  const deprecationQueue = [];
  const releaseProvider = new ReleaseProvider(rootPath);
  const deprecations = [];

  await Promise.all(
    Array(WORKER_COUNT)
      .fill()
      .map(async () => {
        while (packageDirQueue.length) {
          const packageDir = packageDirQueue.pop();
          const srcDir = join(rootPath, packageDir, 'src');

          if (await fs.pathExists(srcDir)) {
            const files = [];
            for await (const file of glob('**/*.{js,jsx,ts,tsx,mjs,cjs}', {
              cwd: srcDir,
            })) {
              files.push(file);
            }
            fileQueue.push(
              ...files.map(file => ({
                packageDir,
                file: join(srcDir, file),
              })),
            );
          }
        }

        while (fileQueue.length) {
          const { packageDir, file } = fileQueue.pop();
          const content = await fs.readFile(file, 'utf8');
          if (!deprecatedPattern.test(content)) {
            continue;
          }

          const lines = content.split('\n');
          for (const [index, line] of lines.entries()) {
            if (deprecatedPattern.test(line)) {
              deprecationQueue.push({
                packageDir,
                file,
                lineNumber: index + 1,
                lineContent: line,
              });
            }
          }
        }

        while (deprecationQueue.length) {
          const deprecation = deprecationQueue.pop();
          const { file, packageDir, lineNumber: n } = deprecation;

          const { stdout: blameOutput } = await execFile('git', [
            'blame',
            '--porcelain',
            '-L',
            `${n},${n}`,
            file,
          ]);

          const blameInfo = Object.fromEntries(
            blameOutput
              .split('\n')
              .slice(1, -2)
              .map(line => {
                const [key] = line.split(' ', 1);
                return [key, line.slice(key.length + 1)];
              }),
          );
          const [commit] = blameOutput.split(' ', 1);
          const { author, ['author-time']: authorTime } = blameInfo;

          const release = await releaseProvider.lookup(commit, packageDir);

          deprecations.push({
            file: relative(rootPath, file),
            release,
            commit,
            author,
            authorTime: new Date(authorTime * 1000),
            lineNumber: n,
          });
        }
      }),
  );

  if (deprecations.length === 0) {
    console.log('No deprecations found.');
    return;
  }

  const maxAuthor = Math.max(...deprecations.map(d => d.author.length)) + 1;

  const sortedByRelease = _.sortBy(
    Object.entries(_.groupBy(deprecations, 'release')),
    ([release]) => release,
  );

  for (const [release, ds] of sortedByRelease) {
    console.log(`\n### ${release === 'undefined' ? 'Not released' : release}`);
    for (const d of _.sortBy(ds, 'authorTime', 'file', 'lineNumber')) {
      console.log(
        [
          d.commit.slice(0, 8),
          d.authorTime.toLocaleDateString().padEnd('00/00/0000'.length + 1),
          d.author.padEnd(maxAuthor + 1),
          `${d.file}:${d.lineNumber}`,
        ].join(' '),
      );
    }
  }
}

main().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
