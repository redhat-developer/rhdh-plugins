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

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { mock, test } from 'node:test';

import { parse } from 'yaml';

import { updateOverlays } from './update-overlays.js';

const sha = 'a'.repeat(40);
const sourceRepo = 'redhat-developer/rhdh-plugins';
const overlayRepo = 'redhat-developer/rhdh-plugin-export-overlays';
const workspace = 'orchestrator';
const newerSha = 'c'.repeat(40);

function workflow(name) {
  return parse(
    readFileSync(
      new URL(`../../.github/workflows/${name}`, import.meta.url),
      'utf8',
    ),
  );
}

function overlayPr(branch = 'main', overrides = {}) {
  return {
    number: 4200,
    html_url: `https://github.com/${overlayRepo}/pull/4200`,
    state: 'open',
    merged_at: null,
    base: { ref: branch },
    head: {
      ref: `workspaces/${branch}__${workspace}`,
      sha: 'overlay-head',
      repo: { full_name: overlayRepo },
    },
    ...overrides,
  };
}

function fixture({ branch = 'main', lists, releaseOverrides } = {}) {
  const targetBranch = branch.split('/')[0];
  const release = {
    number: 123,
    merged_at: '2026-10-30T10:00:00Z',
    merge_commit_sha: sha,
    title: `Version Packages (${workspace})`,
    user: { login: 'rhdh-bot' },
    base: { ref: branch, repo: { full_name: sourceRepo } },
    head: {
      ref:
        branch === 'main'
          ? `changesets-release/${workspace}/main`
          : `maintenance-changesets-release/${targetBranch}/${workspace}`,
      repo: { full_name: sourceRepo },
    },
    ...releaseOverrides,
  };
  const sources = new Map([
    [
      targetBranch,
      { repo: `https://github.com/${sourceRepo}`, 'repo-ref': 'old' },
    ],
    [
      'overlay-head',
      { repo: `https://github.com/${sourceRepo}`, 'repo-ref': sha },
    ],
    [
      'stale-head',
      { repo: `https://github.com/${sourceRepo}`, 'repo-ref': 'old' },
    ],
  ]);
  const prLists = lists ?? [[], [overlayPr(targetBranch)]];
  const comments = [];
  const github = {
    rest: {
      repos: {
        listPullRequestsAssociatedWithCommit: mock.fn(async () => ({
          data: [release],
        })),
        compareCommits: mock.fn(async () => ({ data: { status: 'diverged' } })),
        getContent: mock.fn(async ({ ref }) => {
          if (!sources.has(ref)) {
            throw Object.assign(new Error('Not found'), { status: 404 });
          }
          return {
            data: {
              type: 'file',
              encoding: 'base64',
              content: Buffer.from(JSON.stringify(sources.get(ref))).toString(
                'base64',
              ),
            },
          };
        }),
      },
      pulls: {
        list: mock.fn(async () => ({
          data: prLists.length > 1 ? prLists.shift() : prLists[0],
        })),
      },
      actions: {
        createWorkflowDispatch: mock.fn(async () => ({
          data: {
            workflow_run_id: 456,
            html_url: `https://github.com/${overlayRepo}/actions/runs/456`,
          },
        })),
        getWorkflowRun: mock.fn(async () => ({
          data: { status: 'in_progress' },
        })),
      },
      issues: {
        listComments: mock.fn(async () => ({ data: comments })),
        createComment: mock.fn(async ({ body }) => {
          comments.push({ body });
        }),
      },
    },
    paginate: async (method, params) => (await method(params)).data,
  };
  const core = { info: mock.fn(), warning: mock.fn() };
  const run = overrides =>
    updateOverlays({
      github,
      core,
      context: {
        repo: { owner: 'redhat-developer', repo: 'rhdh-plugins' },
        sha,
      },
      workspace,
      branch,
      attempts: 3,
      interval: 0,
      wait: async () => {},
      ...overrides,
    });
  return { github, core, run, release, sources, comments };
}

test('dispatches a scoped main update, verifies its source SHA, and comments once on reruns', async () => {
  const { github, run, comments } = fixture();
  await run();
  assert.deepEqual(
    github.rest.actions.createWorkflowDispatch.mock.calls[0].arguments[0],
    {
      owner: 'redhat-developer',
      repo: 'rhdh-plugin-export-overlays',
      workflow_id: 'update-plugins-repo-refs.yaml',
      ref: 'main',
      inputs: {
        'workspace-path': 'workspaces/orchestrator',
        'single-branch': 'main',
      },
      headers: { 'X-GitHub-Api-Version': '2026-03-10' },
    },
  );
  const comment = github.rest.issues.createComment.mock.calls[0].arguments[0];
  assert.equal(comment.issue_number, 123);
  assert.equal(`${comment.owner}/${comment.repo}`, sourceRepo);
  assert.match(comment.body, /rhdh-plugin-export-overlays\/pull\/4200/);
  assert.match(comment.body, new RegExp(sha));
  assert.ok(
    github.rest.repos.getContent.mock.calls.some(
      call => call.arguments[0].ref === 'overlay-head',
    ),
  );
  await run();
  assert.equal(github.rest.actions.createWorkflowDispatch.mock.callCount(), 1);
  assert.equal(comments.length, 1);
});

test('maps repository-wide and legacy maintenance branches to the matching overlays branch', async () => {
  for (const branch of [
    'release-2.1',
    'release-3.0',
    'release-10.2',
    'release-1.9/orchestrator',
    'release-1.10/orchestrator',
  ]) {
    const { github, run } = fixture({ branch });
    await run();
    const request =
      github.rest.actions.createWorkflowDispatch.mock.calls[0].arguments[0];
    assert.equal(request.ref, 'main');
    assert.equal(request.inputs['single-branch'], branch.split('/')[0]);
    assert.equal(request.inputs['workspace-path'], 'workspaces/orchestrator');
  }
});

test('explicitly refreshes a stale open PR instead of relying on the manual-update label', async () => {
  const stale = overlayPr('main', {
    head: { ...overlayPr().head, sha: 'stale-head' },
  });
  const { github, run } = fixture({ lists: [[stale], [stale], [overlayPr()]] });
  await run();
  assert.equal(
    github.rest.actions.createWorkflowDispatch.mock.calls[0].arguments[0]
      .inputs['pr-to-update'],
    '4200',
  );
  assert.equal(github.rest.issues.createComment.mock.callCount(), 1);
  assert.equal(
    github.rest.actions.getWorkflowRun.mock.calls[0].arguments[0].run_id,
    456,
  );
  assert.equal(
    github.rest.repos.getContent.mock.calls.filter(
      call => call.arguments[0].ref === 'stale-head',
    ).length,
    1,
  );
});

test('links a matching already-merged PR without dispatching again', async () => {
  const merged = overlayPr('main', {
    state: 'closed',
    merged_at: '2026-10-30T11:00:00Z',
  });
  const { github, run } = fixture({ lists: [[merged]] });
  await run();
  assert.equal(github.rest.actions.createWorkflowDispatch.mock.callCount(), 0);
  assert.equal(github.rest.issues.createComment.mock.callCount(), 1);
});

test('never links a closed-unmerged PR or a PR from another repository, branch, or workspace', async () => {
  const wrongPrs = [
    overlayPr('main', { state: 'closed' }),
    overlayPr('release-2.1'),
    overlayPr('main', {
      head: { ...overlayPr().head, repo: { full_name: 'other/fork' } },
    }),
    overlayPr('main', {
      head: { ...overlayPr().head, ref: 'workspaces/main__quickstart' },
    }),
  ];
  const { github, run } = fixture({ lists: [wrongPrs] });
  await assert.rejects(run(), /Timed out/);
  assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
  assert.equal(github.rest.actions.getWorkflowRun.mock.callCount(), 3);
  assert.equal(
    github.rest.actions.createWorkflowDispatch.mock.calls[0].arguments[0]
      .inputs['pr-to-update'],
    undefined,
  );
});

test('does not link a PR with the wrong source repository or commit', async () => {
  for (const source of [
    { repo: `https://github.com/${sourceRepo}`, 'repo-ref': 'wrong-sha' },
    { repo: 'https://github.com/backstage/community-plugins', 'repo-ref': sha },
  ]) {
    const { github, run, sources } = fixture({ lists: [[overlayPr()]] });
    sources.set('overlay-head', source);
    await assert.rejects(run(), /Timed out/);
    assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
  }
});

test('skips workspaces absent from overlays or owned by a different upstream', async () => {
  for (const source of [
    undefined,
    { repo: 'https://github.com/backstage/community-plugins' },
  ]) {
    const { github, core, run, sources } = fixture();
    if (source) sources.set('main', source);
    else sources.delete('main');
    await run();
    assert.equal(
      github.rest.actions.createWorkflowDispatch.mock.callCount(),
      0,
    );
    assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
    assert.equal(core.warning.mock.callCount(), 1);
  }
});

test('requires the exact merged Version Packages PR, bot author, and same-repository head and base', async () => {
  const changes = [
    { merged_at: null },
    { merge_commit_sha: 'unrelated-commit' },
    { title: 'Version Packages (quickstart)' },
    { user: { login: 'somebody-else' } },
    { base: { ref: 'release-2.1', repo: { full_name: sourceRepo } } },
    { base: { ref: 'main', repo: { full_name: 'other/repository' } } },
    { head: { ref: 'unrelated-branch', repo: { full_name: sourceRepo } } },
    {
      head: {
        ref: 'changesets-release/orchestrator/main',
        repo: { full_name: 'other/fork' },
      },
    },
  ];
  for (const releaseOverrides of changes) {
    const { github, run } = fixture({ releaseOverrides });
    await assert.rejects(run(), /Expected exactly one merged/);
    assert.equal(
      github.rest.actions.createWorkflowDispatch.mock.callCount(),
      0,
    );
    assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
  }
});

test('rejects fork runs and invalid branch/workspace inputs before using GitHub', async () => {
  for (const overrides of [
    { context: { repo: { owner: 'other', repo: 'rhdh-plugins' }, sha } },
    { workspace: '../other' },
    { branch: 'feature/test' },
    { branch: 'release-1.10/quickstart' },
    { branch: 'release-2.1/orchestrator' },
    { branch: 'release-1.10' },
  ]) {
    const { github, run } = fixture();
    await assert.rejects(run(overrides));
    assert.equal(
      github.rest.repos.listPullRequestsAssociatedWithCommit.mock.callCount(),
      0,
    );
    assert.equal(
      github.rest.actions.createWorkflowDispatch.mock.callCount(),
      0,
    );
  }
});

test('reports failed, cancelled, or no-op update runs without posting a misleading link', async () => {
  for (const conclusion of ['failure', 'cancelled', 'success']) {
    const { github, run } = fixture({ lists: [[]] });
    github.rest.actions.getWorkflowRun.mock.mockImplementation(async () => ({
      data: { status: 'completed', conclusion },
    }));
    await assert.rejects(
      run(),
      new RegExp(`Overlays run finished \\(${conclusion}\\).*actions/runs/456`),
    );
    assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
  }
});

test('propagates permission errors and rejects dispatch responses without a run ID', async () => {
  const { github, run } = fixture({ lists: [[]] });
  github.rest.actions.createWorkflowDispatch.mock.mockImplementation(
    async () => {
      throw Object.assign(new Error('Resource not accessible'), {
        status: 403,
      });
    },
  );
  await assert.rejects(run(), /Resource not accessible/);
  github.rest.actions.createWorkflowDispatch.mock.mockImplementation(
    async () => ({ status: 204 }),
  );
  await assert.rejects(run(), /did not return a workflow run ID/);
  assert.equal(github.rest.issues.createComment.mock.callCount(), 0);
});

function trackNewerRelease(f, overrides = {}) {
  f.sources.set('overlay-head', {
    repo: `https://github.com/${sourceRepo}`,
    'repo-ref': newerSha,
  });
  f.github.rest.repos.compareCommits.mock.mockImplementation(async () => ({
    data: { status: 'ahead' },
  }));
  f.github.rest.repos.listPullRequestsAssociatedWithCommit.mock.mockImplementation(
    async ({ commit_sha }) => ({
      data: [
        commit_sha === sha
          ? f.release
          : {
              ...f.release,
              number: 125,
              merge_commit_sha: newerSha,
              ...overrides,
            },
      ],
    }),
  );
}

test('reconciles an older release to a verified newer Version Packages commit', async () => {
  const f = fixture({ lists: [[overlayPr()]] });
  trackNewerRelease(f);
  await f.run();
  assert.equal(
    f.github.rest.actions.createWorkflowDispatch.mock.callCount(),
    0,
  );
  const comment = f.github.rest.issues.createComment.mock.calls[0].arguments[0];
  assert.equal(comment.issue_number, 123);
  assert.match(comment.body, new RegExp(`Published.*${sha}`));
  assert.match(
    comment.body,
    new RegExp(`newer Version Packages commit.*${newerSha}`),
  );
  assert.deepEqual(
    f.github.rest.repos.compareCommits.mock.calls[0].arguments[0],
    {
      owner: 'redhat-developer',
      repo: 'rhdh-plugins',
      base: sha,
      head: newerSha,
    },
  );
});

test('does not duplicate the original link when a later release advances the same overlays PR', async () => {
  const f = fixture({ lists: [[overlayPr()]] });
  await f.run();
  trackNewerRelease(f);
  await f.run();
  assert.equal(f.github.rest.issues.createComment.mock.callCount(), 1);
  assert.equal(
    f.github.rest.actions.createWorkflowDispatch.mock.callCount(),
    0,
  );
});

test('a comment for a different overlays PR does not suppress this release link', async () => {
  const f = fixture({ lists: [[overlayPr()]] });
  f.comments.push({
    body: [
      `<!-- rhdh-overlays-update:${workspace}:${sha} -->`,
      `Overlays update for \`main\`: https://github.com/${overlayRepo}/pull/42000`,
    ].join('\n'),
  });
  await f.run();
  assert.equal(f.github.rest.issues.createComment.mock.callCount(), 1);
});

test('rejects newer source refs that are not trusted releases on the same branch and lineage', async () => {
  for (const status of ['behind', 'diverged', 'identical']) {
    const f = fixture({ lists: [[overlayPr()]] });
    trackNewerRelease(f);
    f.github.rest.repos.compareCommits.mock.mockImplementation(async () => ({
      data: { status },
    }));
    await assert.rejects(f.run(), /Timed out/);
    assert.equal(f.github.rest.issues.createComment.mock.callCount(), 0);
  }
  for (const overrides of [
    { merged_at: null },
    { user: { login: 'not-the-release-bot' } },
    { title: 'Version Packages (theme)' },
    { base: { ref: 'release-2.1', repo: { full_name: sourceRepo } } },
    {
      head: {
        ref: 'changesets-release/orchestrator/main',
        repo: { full_name: 'other/fork' },
      },
    },
  ]) {
    const f = fixture({ lists: [[overlayPr()]] });
    trackNewerRelease(f, overrides);
    await assert.rejects(f.run(), /Timed out/);
    assert.equal(f.github.rest.issues.createComment.mock.callCount(), 0);
  }
});

test('waits for a later update after its own dispatch is cancelled or finishes without a PR', async () => {
  for (const conclusion of ['cancelled', 'success']) {
    const f = fixture({ lists: [[], [], [overlayPr()]] });
    trackNewerRelease(f);
    f.github.rest.actions.getWorkflowRun.mock.mockImplementation(async () => ({
      data: { status: 'completed', conclusion },
    }));
    await f.run();
    assert.equal(f.github.rest.actions.getWorkflowRun.mock.callCount(), 2);
    assert.equal(f.github.rest.issues.createComment.mock.callCount(), 1);
    assert.match(f.comments[0].body, new RegExp(newerSha));
  }
});

test('reconciles A, B, and C even when overlays replaces the middle pending dispatch', async () => {
  const f = fixture();
  const commits = [sha, 'b'.repeat(40), newerSha];
  const releases = commits.map((commit, index) => ({
    ...f.release,
    number: 123 + index,
    merge_commit_sha: commit,
  }));
  f.sources.set('overlay-head', {
    repo: `https://github.com/${sourceRepo}`,
    'repo-ref': newerSha,
  });
  f.github.rest.repos.listPullRequestsAssociatedWithCommit.mock.mockImplementation(
    async ({ commit_sha }) => ({
      data: releases.filter(pr => pr.merge_commit_sha === commit_sha),
    }),
  );
  f.github.rest.repos.compareCommits.mock.mockImplementation(
    async ({ base, head }) => ({
      data: {
        status:
          commits.indexOf(head) > commits.indexOf(base) ? 'ahead' : 'behind',
      },
    }),
  );
  let dispatches = 0;
  let prCreated = false;
  let unblock;
  const allDispatched = new Promise(resolve => {
    unblock = resolve;
  });
  f.github.rest.pulls.list.mock.mockImplementation(async () => ({
    data: prCreated ? [overlayPr()] : [],
  }));
  f.github.rest.actions.createWorkflowDispatch.mock.mockImplementation(
    async () => {
      dispatches++;
      const id = dispatches;
      if (dispatches === 3) unblock();
      return {
        data: {
          workflow_run_id: id,
          html_url: `https://github.com/${overlayRepo}/actions/runs/${id}`,
        },
      };
    },
  );
  f.github.rest.actions.getWorkflowRun.mock.mockImplementation(
    async ({ run_id }) => {
      prCreated = true;
      return {
        data: {
          status: 'completed',
          conclusion: run_id === 2 ? 'cancelled' : 'success',
        },
      };
    },
  );
  await Promise.all(
    commits.map(commit =>
      f.run({
        context: {
          repo: { owner: 'redhat-developer', repo: 'rhdh-plugins' },
          sha: commit,
        },
        wait: () => allDispatched,
      }),
    ),
  );
  const comments = f.github.rest.issues.createComment.mock.calls.map(
    call => call.arguments[0],
  );
  assert.equal(dispatches, 3);
  assert.deepEqual(
    comments.map(comment => comment.issue_number).sort(),
    [123, 124, 125],
  );
  for (let index = 0; index < commits.length; index++) {
    const comment = comments.find(entry => entry.issue_number === 123 + index);
    assert.match(comment.body, new RegExp(`Published.*${commits[index]}`));
    assert.match(comment.body, /rhdh-plugin-export-overlays\/pull\/4200/);
  }
});

test('follow-ups do not use a lossy shared concurrency group', () => {
  const followUp = workflow('update-overlays.yml');
  assert.equal(followUp.concurrency, undefined);
  for (const job of Object.values(followUp.jobs)) {
    assert.equal(job.concurrency, undefined);
  }
  for (const caller of [
    'release_workspace.yml',
    'release_workspace_version.yml',
  ]) {
    assert.equal(
      workflow(caller).jobs['update-overlays'].concurrency,
      undefined,
    );
  }
});

test('automatic release checkouts use the event SHA while manual releases keep their selected branch', () => {
  const main = workflow('release_workspace.yml');
  const expected =
    "${{ github.event_name == 'push' && github.sha || inputs.branch }}";
  for (const name of ['changesets-pr', 'release']) {
    const checkout = main.jobs[name].steps.find(step =>
      step.uses?.startsWith('actions/checkout@'),
    );
    assert.equal(checkout.with.ref, expected);
  }
  const legacy = workflow('release_workspace_version.yml');
  for (const name of ['release', 'repository-release']) {
    const checkout = legacy.jobs[name].steps.find(step =>
      step.uses?.startsWith('actions/checkout@'),
    );
    assert.equal(checkout.with.ref, '${{ github.sha }}');
  }
});

test('publish guards reject a branch-advanced checkout before npm publication', () => {
  const jobs = [
    workflow('release_workspace.yml').jobs.release,
    workflow('release_workspace_version.yml').jobs.release,
    workflow('release_workspace_version.yml').jobs['repository-release'],
  ];
  const dir = mkdtempSync(
    join(process.env.RUNNER_TEMP || tmpdir(), 'rhdh-publish-sha-'),
  );
  try {
    writeFileSync(
      join(dir, 'git'),
      '#!/bin/sh\nprintf "%s\\n" "$TEST_CHECKOUT_SHA"\n',
      { mode: 0o755 },
    );
    for (const job of jobs) {
      const index = job.steps.findIndex(
        step => step.name === 'Verify release commit',
      );
      assert.ok(index >= 0, 'Publish job must verify its checked-out commit');
      assert.ok(index < job.steps.findIndex(step => step.name === 'publish'));
      const guard = job.steps[index];
      assert.equal(guard.env.RELEASE_SHA, '${{ github.sha }}');
      for (const actualSha of [sha, newerSha]) {
        const result = spawnSync('bash', ['-e', '-c', guard.run], {
          encoding: 'utf8',
          timeout: 10_000,
          env: {
            ...process.env,
            PATH: `${dir}${delimiter}${process.env.PATH}`,
            RELEASE_SHA: sha,
            TEST_CHECKOUT_SHA: actualSha,
          },
        });
        assert.equal(result.status, actualSha === sha ? 0 : 1, result.stderr);
        if (actualSha !== sha)
          assert.match(result.stderr, /Refusing to publish/);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
