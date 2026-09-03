'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const postFix = path.join(root, '.fullsend/rhdh/scripts/post-ci-fix.sh');
const baseSha = 'a'.repeat(40);

function git(repo, ...args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fullsend-ci-post-repo-'));
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.name', 'CI Agent Test');
  git(repo, 'config', 'user.email', 'ci-agent@example.invalid');
  fs.mkdirSync(path.join(repo, 'workspaces/boost'), { recursive: true });
  fs.writeFileSync(
    path.join(repo, 'workspaces/boost/example.ts'),
    'export const value = 1;\n',
  );
  git(repo, 'add', '.');
  git(repo, 'commit', '-qm', 'base');
  const base = git(repo, 'rev-parse', 'HEAD');
  fs.writeFileSync(
    path.join(repo, 'workspaces/boost/example.ts'),
    'export const value = 2;\n',
  );
  git(repo, 'add', '.');
  git(repo, 'commit', '-qm', 'fix(ci-agent): targeted repair');
  return { repo, base, head: git(repo, 'rev-parse', 'HEAD') };
}

function makeRun({
  currentHead,
  trustedHead = baseSha,
  status = 'no_change',
  verificationPassed = true,
  repoDir = '',
  gitleaksExit = 0,
  rejectPush = false,
}) {
  const runDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'fullsend-ci-post-run-'),
  );
  const iterationDir = path.join(runDir, 'iteration-1/output');
  const fakeBin = path.join(runDir, 'fake-bin');
  fs.mkdirSync(iterationDir, { recursive: true });
  fs.mkdirSync(fakeBin);
  const context = {
    pull_request: {
      number: 7,
      head: {
        sha: trustedHead,
        ref: 'feature/repair',
        repo: { full_name: 'redhat-developer/rhdh-plugins' },
      },
    },
    _fullsend_ci: {
      version: 1,
      kind: 'fix',
      automation_mode: 'repair',
      run_id: 50,
      run_attempt: 1,
      head_sha: trustedHead,
      workspace: 'boost',
      iteration: 1,
    },
  };
  const commit = repoDir ? git(repoDir, 'rev-parse', 'HEAD') : 'b'.repeat(40);
  const result = {
    schema_version: 1,
    pr: { number: 7, head_sha: trustedHead, head_ref: 'feature/repair' },
    run: { id: 50, attempt: 1 },
    analyzed_head_sha: trustedHead,
    workspace: 'boost',
    iteration: 1,
    status,
    strategy: 'test strategy',
    files: status === 'committed' ? ['workspaces/boost/example.ts'] : [],
    verification: [
      {
        command: 'yarn test',
        exit_code: verificationPassed ? 0 : 1,
        passed: verificationPassed,
        summary: 'test',
      },
    ],
    commit: status === 'committed' ? commit : null,
    summary: 'test result',
  };
  const contextFile = path.join(runDir, 'context.json');
  const prFile = path.join(runDir, 'pr.json');
  const ghLog = path.join(runDir, 'gh.log');
  fs.writeFileSync(contextFile, JSON.stringify(context));
  fs.writeFileSync(
    path.join(iterationDir, 'agent-result.json'),
    JSON.stringify(result),
  );
  fs.writeFileSync(
    prFile,
    JSON.stringify({
      state: 'open',
      head: {
        sha: currentHead,
        ref: 'feature/repair',
        repo: { full_name: 'redhat-developer/rhdh-plugins' },
      },
      labels: [],
    }),
  );
  fs.writeFileSync(
    path.join(fakeBin, 'gh'),
    `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$FAKE_GH_LOG"
if [[ "${'${1:-}'}" == api && "${'${2:-}'}" == repos/*/pulls/* ]]; then
  command cat "$FAKE_PR_FILE"
fi
exit 0
`,
    { mode: 0o755 },
  );
  fs.writeFileSync(
    path.join(fakeBin, 'gitleaks'),
    '#!/usr/bin/env bash\nexit "${FAKE_GITLEAKS_EXIT:-0}"\n',
    { mode: 0o755 },
  );
  if (rejectPush) {
    fs.writeFileSync(
      path.join(fakeBin, 'git'),
      '#!/usr/bin/env bash\nfor arg in "$@"; do [[ "$arg" != push ]] || exit 1; done\nexec "$REAL_GIT" "$@"\n',
      { mode: 0o755 },
    );
  }
  const execution = spawnSync(postFix, [], {
    cwd: runDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH}`,
      GH_TOKEN: 'test-token',
      REPO_FULL_NAME: 'redhat-developer/rhdh-plugins',
      GITHUB_ISSUE_URL:
        'https://github.com/redhat-developer/rhdh-plugins/pull/7',
      CI_CONTEXT_FILE: contextFile,
      FULLSEND_VALIDATED_ITERATION_DIR: path.join(runDir, 'iteration-1'),
      REPO_DIR: repoDir,
      FAKE_PR_FILE: prFile,
      FAKE_GH_LOG: ghLog,
      FAKE_GITLEAKS_EXIT: String(gitleaksExit),
      REAL_GIT: spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim(),
    },
  });
  return { runDir, execution, ghLog };
}

test('stale head is rejected and escalated through fake GitHub', t => {
  const run = makeRun({ currentHead: 'c'.repeat(40) });
  t.after(() => fs.rmSync(run.runDir, { recursive: true, force: true }));
  assert.notEqual(run.execution.status, 0);
  assert.match(fs.readFileSync(run.ghLog, 'utf8'), /labels\[\]=needs-human/);
});

test('failed targeted verification is rejected before repository mutation', t => {
  const run = makeRun({
    currentHead: baseSha,
    status: 'committed',
    verificationPassed: false,
  });
  t.after(() => fs.rmSync(run.runDir, { recursive: true, force: true }));
  assert.notEqual(run.execution.status, 0);
  assert.match(
    run.execution.stderr + run.execution.stdout,
    /verification did not pass/i,
  );
});

test('no-change result produces no commit and escalates', t => {
  const run = makeRun({ currentHead: baseSha, status: 'no_change' });
  t.after(() => fs.rmSync(run.runDir, { recursive: true, force: true }));
  assert.equal(
    run.execution.status,
    0,
    run.execution.stderr + run.execution.stdout,
  );
  assert.match(fs.readFileSync(run.ghLog, 'utf8'), /needs-human/);
});

test('secret findings and non-fast-forward push failures are rejected', async t => {
  await t.test('secret finding', t => {
    const built = makeRepo();
    const run = makeRun({
      currentHead: built.base,
      trustedHead: built.base,
      status: 'committed',
      repoDir: built.repo,
      gitleaksExit: 1,
    });
    t.after(() => fs.rmSync(run.runDir, { recursive: true, force: true }));
    t.after(() => fs.rmSync(built.repo, { recursive: true, force: true }));
    assert.notEqual(run.execution.status, 0);
    assert.match(
      run.execution.stderr + run.execution.stdout,
      /Secret scanning rejected/i,
    );
  });
  await t.test('push rejection', t => {
    const built = makeRepo();
    const remote = fs.mkdtempSync(
      path.join(os.tmpdir(), 'fullsend-ci-post-remote-'),
    );
    git(remote, 'init', '--bare', '-q');
    git(built.repo, 'remote', 'add', 'origin', remote);
    git(
      built.repo,
      'push',
      '-q',
      'origin',
      `${built.base}:refs/heads/feature/repair`,
    );
    const run = makeRun({
      currentHead: built.base,
      trustedHead: built.base,
      status: 'committed',
      repoDir: built.repo,
      rejectPush: true,
    });
    t.after(() => fs.rmSync(run.runDir, { recursive: true, force: true }));
    t.after(() => fs.rmSync(built.repo, { recursive: true, force: true }));
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    assert.notEqual(run.execution.status, 0);
    assert.match(
      run.execution.stderr + run.execution.stdout,
      /fast-forward push was rejected/i,
    );
  });
});
