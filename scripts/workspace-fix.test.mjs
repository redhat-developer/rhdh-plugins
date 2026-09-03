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

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  DEFAULT_NODE_OPTIONS,
  FIXER_ORDER,
  REPO_ROOT_PACKAGE_NAME,
  assertWorkspaceRoot,
  buildSteps,
  detectTools,
  mergeNodeOptions,
  parseArgs,
  readPackageJson,
  resolveConfig,
  resolveSpawnEnv,
  runPipeline,
} from './workspace-fix.mjs';

const ALL_TOOLS = {
  backstageCli: true,
  prettier: true,
  sortPackageJson: true,
  markdownlint: 'markdownlint-cli',
  knip: true,
};

test('fixer order is documented and stable', () => {
  assert.deepEqual(FIXER_ORDER, [
    'repo-fix',
    'sort-package-json',
    'lint-fix',
    'markdownlint',
    'prettier',
    'knip',
  ]);
});

test('parseArgs accepts publish, check, and knip flags', () => {
  assert.deepEqual(parseArgs(['--publish', '--check', '--knip']), {
    flags: { publish: true, check: true, knip: true, help: false },
    extra: [],
  });
});

test('parseArgs rejects unknown flags', () => {
  assert.throws(() => parseArgs(['--write']), /Unknown flag '--write'/);
});

test('assertWorkspaceRoot rejects the monorepo root', () => {
  assert.throws(
    () => assertWorkspaceRoot({ name: REPO_ROOT_PACKAGE_NAME, workspaces: {} }),
    /per workspace/,
  );
});

test('assertWorkspaceRoot rejects a package without workspaces', () => {
  assert.throws(
    () => assertWorkspaceRoot({ name: '@internal/noop' }),
    /workspaces field/,
  );
});

test('readPackageJson fails without package.json', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'workspace-fix-'));
  assert.throws(() => readPackageJson(cwd), /No package.json/);
});

test('resolveConfig merges package.json with CLI flags', () => {
  assert.deepEqual(
    resolveConfig({ rhdhFix: { publish: true } }, { check: true, knip: true }),
    {
      check: true,
      publish: true,
      knip: true,
      nodeOptions: undefined,
    },
  );
});

test('mergeNodeOptions preserves an existing heap limit', () => {
  assert.equal(
    mergeNodeOptions('--max-old-space-size=16384', DEFAULT_NODE_OPTIONS),
    '--max-old-space-size=16384',
  );
});

test('resolveSpawnEnv sets NODE_OPTIONS for lint-fix', () => {
  const env = resolveSpawnEnv(
    { id: 'lint-fix' },
    resolveConfig({}, { publish: false, knip: false, check: false }),
    {},
  );
  assert.equal(env.NODE_OPTIONS, DEFAULT_NODE_OPTIONS);
});

test('resolveSpawnEnv honors rhdhFix.nodeOptions', () => {
  const env = resolveSpawnEnv(
    { id: 'lint-fix' },
    resolveConfig(
      { rhdhFix: { nodeOptions: '--max-old-space-size=16384' } },
      {},
    ),
    {},
  );
  assert.equal(env.NODE_OPTIONS, '--max-old-space-size=16384');
});

test('detectTools reads workspace dependencies', () => {
  assert.deepEqual(
    detectTools({
      devDependencies: {
        '@backstage/cli': '^0.36.0',
        prettier: '^3.0.0',
        knip: '^5.0.0',
      },
    }),
    {
      backstageCli: true,
      prettier: true,
      sortPackageJson: false,
      markdownlint: undefined,
      knip: true,
    },
  );
});

test('buildSteps keeps documented order and default knip off', () => {
  const steps = buildSteps({
    tools: ALL_TOOLS,
    config: { check: false, publish: false, knip: false },
  });
  assert.deepEqual(
    steps.map(step => step.id),
    FIXER_ORDER,
  );
  const knip = steps.find(step => step.id === 'knip');
  assert.equal(knip.available, false);
  assert.match(knip.skipReason, /opt-in/);

  const repoFix = steps.find(step => step.id === 'repo-fix');
  assert.deepEqual(repoFix.args, ['backstage-cli', 'repo', 'fix']);
});

test('buildSteps passes --publish to repo fix and enables knip when opted in', () => {
  const steps = buildSteps({
    tools: ALL_TOOLS,
    config: { check: false, publish: true, knip: true },
  });
  assert.deepEqual(steps.find(step => step.id === 'repo-fix').args, [
    'backstage-cli',
    'repo',
    'fix',
    '--publish',
  ]);
  assert.equal(steps.find(step => step.id === 'knip').available, true);
});

test('buildSteps in check mode only runs repo fix with --check', () => {
  const steps = buildSteps({
    tools: ALL_TOOLS,
    config: { check: true, publish: true, knip: true },
  });
  assert.deepEqual(
    steps.map(step => step.id),
    ['repo-fix'],
  );
  assert.deepEqual(steps[0].args, [
    'backstage-cli',
    'repo',
    'fix',
    '--check',
    '--publish',
  ]);
});

test('runPipeline in check mode only runs repo fix', async () => {
  const ran = [];
  await runPipeline(
    buildSteps({
      tools: ALL_TOOLS,
      config: { check: true, publish: false, knip: true },
    }),
    {
      log: () => {},
      run: async step => {
        ran.push(step.id);
        return 0;
      },
    },
  );
  assert.deepEqual(ran, ['repo-fix']);
});

test('optional fixers are skipped when their packages are not installed', () => {
  const steps = buildSteps({
    tools: {
      backstageCli: true,
      prettier: false,
      sortPackageJson: false,
      markdownlint: undefined,
      knip: false,
    },
    config: { check: false, publish: false, knip: false },
  });
  assert.equal(
    steps.find(step => step.id === 'sort-package-json').available,
    false,
  );
  assert.equal(steps.find(step => step.id === 'markdownlint').available, false);
  assert.equal(steps.find(step => step.id === 'prettier').available, false);
});

test('runPipeline skips optional missing fixers and still succeeds', async () => {
  const ran = [];
  const logs = [];
  await runPipeline(
    buildSteps({
      tools: {
        backstageCli: true,
        prettier: true,
        sortPackageJson: false,
        markdownlint: undefined,
        knip: true,
      },
      config: { check: false, publish: false, knip: false },
    }),
    {
      log: msg => logs.push(msg),
      run: async step => {
        ran.push(step.id);
        return 0;
      },
    },
  );
  assert.deepEqual(ran, ['repo-fix', 'lint-fix', 'prettier']);
  assert.ok(logs.some(line => line.startsWith('skip sort-package-json')));
  assert.ok(logs.some(line => line.startsWith('skip knip')));
});

test('runPipeline exits non-zero when a fixer fails', async () => {
  await assert.rejects(
    () =>
      runPipeline(
        buildSteps({
          tools: ALL_TOOLS,
          config: { check: false, publish: false, knip: false },
        }),
        {
          log: () => {},
          run: async step => (step.id === 'lint-fix' ? 2 : 0),
        },
      ),
    error => error.exitCode === 2 && /lint-fix/.test(error.message),
  );
});

test('runPipeline fails when a required fixer is missing', async () => {
  await assert.rejects(
    () =>
      runPipeline(
        buildSteps({
          tools: {
            backstageCli: false,
            prettier: true,
            sortPackageJson: false,
            markdownlint: undefined,
            knip: false,
          },
          config: { check: false, publish: false, knip: false },
        }),
        { log: () => {}, run: async () => 0 },
      ),
    /Required fixer 'repo-fix'/,
  );
});

test('runPipeline succeeds when fixers report changes as success', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'workspace-fix-pkg-'));
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: '@internal/example',
      workspaces: { packages: ['packages/*'] },
      devDependencies: { '@backstage/cli': '1.0.0', prettier: '3.0.0' },
    }),
  );
  const pkg = readPackageJson(cwd);
  assertWorkspaceRoot(pkg);
  await runPipeline(
    buildSteps({
      tools: detectTools(pkg),
      config: resolveConfig(pkg, { publish: false, knip: false, check: false }),
    }),
    { log: () => {}, run: async () => 0 },
  );
});
