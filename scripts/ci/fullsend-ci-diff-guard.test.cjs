'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const guard = path.join(root, '.fullsend/rhdh/scripts/check-ci-fix-diff.sh');

function git(repo, ...args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function repoWithBase() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fullsend-ci-guard-'));
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.name', 'CI Agent Test');
  git(repo, 'config', 'user.email', 'ci-agent@example.invalid');
  fs.mkdirSync(path.join(repo, 'workspaces/boost'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'workspaces/scorecard'), { recursive: true });
  fs.writeFileSync(
    path.join(repo, 'workspaces/boost/example.ts'),
    'export const value = 1;\n',
  );
  fs.writeFileSync(
    path.join(repo, 'workspaces/scorecard/example.ts'),
    'export const value = 1;\n',
  );
  git(repo, 'add', '.');
  git(repo, 'commit', '-qm', 'base');
  return { repo, base: git(repo, 'rev-parse', 'HEAD') };
}

function commit(
  repo,
  file,
  content,
  message = 'fix(ci-agent): targeted repair',
) {
  fs.writeFileSync(path.join(repo, file), content);
  git(repo, 'add', file);
  git(repo, 'commit', '-qm', message);
}

function runGuard(repo, base, workspace = 'boost') {
  return spawnSync(guard, [repo, base, workspace], { encoding: 'utf8' });
}

test('accepts one small direct workspace repair commit', t => {
  const { repo, base } = repoWithBase();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  commit(repo, 'workspaces/boost/example.ts', 'export const value = 2;\n');
  const result = runGuard(repo, base);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).files, [
    'workspaces/boost/example.ts',
  ]);
});

test('rejects cross-workspace paths', t => {
  const { repo, base } = repoWithBase();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  commit(repo, 'workspaces/scorecard/example.ts', 'export const value = 2;\n');
  assert.notEqual(runGuard(repo, base).status, 0);
});

test('rejects oversized and binary diffs', async t => {
  await t.test('oversized', t => {
    const { repo, base } = repoWithBase();
    t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
    commit(
      repo,
      'workspaces/boost/example.ts',
      Array.from({ length: 801 }, (_, index) => `line ${index}`).join('\n'),
    );
    assert.notEqual(runGuard(repo, base).status, 0);
  });
  await t.test('binary', t => {
    const { repo, base } = repoWithBase();
    t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
    commit(repo, 'workspaces/boost/example.ts', Buffer.from([0, 1, 2, 3]));
    assert.notEqual(runGuard(repo, base).status, 0);
  });
});

test('rejects multiple commits and unexpected subjects', async t => {
  await t.test('multiple commits', t => {
    const { repo, base } = repoWithBase();
    t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
    commit(repo, 'workspaces/boost/example.ts', 'export const value = 2;\n');
    commit(repo, 'workspaces/boost/example.ts', 'export const value = 3;\n');
    assert.notEqual(runGuard(repo, base).status, 0);
  });
  await t.test('subject', t => {
    const { repo, base } = repoWithBase();
    t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
    commit(
      repo,
      'workspaces/boost/example.ts',
      'export const value = 2;\n',
      'fix: human-style commit',
    );
    assert.notEqual(runGuard(repo, base).status, 0);
  });
});
