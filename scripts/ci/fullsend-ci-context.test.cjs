'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ci = require('./fullsend-ci-context.cjs');

test('normalizes automation mode fail-closed to observe', () => {
  assert.equal(ci.normalizeAutomationMode(undefined), 'observe');
  assert.equal(ci.normalizeAutomationMode('REPAIR'), 'repair');
  assert.equal(ci.normalizeAutomationMode('invalid'), 'observe');
});

test('parses and deduplicates only valid workspace allowlist entries', () => {
  assert.deepEqual(
    ci.parseWorkspaceAllowlist('boost, scorecard,boost,../root,UPPER'),
    ['boost', 'scorecard'],
  );
});

test('drops aggregate failure and retains failed leaf steps', () => {
  const jobs = ci.failedLeafJobs([
    {
      id: 1,
      name: ci.AGGREGATE_JOB,
      conclusion: 'failure',
      steps: [{ number: 1, name: 'exit', conclusion: 'failure' }],
    },
    {
      id: 2,
      name: 'Workspace boost, CI step for node 22',
      conclusion: 'failure',
      steps: [
        { number: 1, name: 'install', conclusion: 'success' },
        { number: 2, name: 'run playwright tests', conclusion: 'failure' },
      ],
    },
  ]);
  assert.equal(jobs.length, 1);
  assert.deepEqual(jobs[0].failed_steps, [
    { number: 2, name: 'run playwright tests', conclusion: 'failure' },
  ]);
});

test('derives one workspace and all failed node versions', () => {
  assert.deepEqual(
    ci.extractJobScope([
      { name: 'Workspace boost, CI step for node 24' },
      { name: 'Workspace boost, CI step for node 22' },
      { name: 'Workspace boost, Verify step' },
    ]),
    {
      workspace: 'boost',
      node_versions: [22, 24],
      deterministic: true,
      reason: 'single_workspace',
    },
  );
});

test('refuses root, unrecognized, and multi-workspace failure scopes', () => {
  assert.equal(
    ci.extractJobScope([{ name: 'Detect workspace changes' }]).reason,
    'no_workspace_job',
  );
  assert.equal(
    ci.extractJobScope([
      { name: 'Workspace boost, CI step for node 22' },
      { name: 'Detect workspace changes' },
    ]).reason,
    'root_or_unrecognized_job',
  );
  assert.equal(
    ci.extractJobScope([
      { name: 'Workspace boost, CI step for node 22' },
      { name: 'Workspace scorecard, Verify step' },
    ]).reason,
    'multiple_workspaces',
  );
});

test('resolves exactly one open PR at the tested head', () => {
  const sha = 'a'.repeat(40);
  const base = { repo: { full_name: 'redhat-developer/rhdh-plugins' } };
  const candidates = [
    { number: 1, state: 'closed', head: { sha }, base },
    { number: 2, state: 'open', head: { sha }, base },
    { number: 3, state: 'open', head: { sha: 'b'.repeat(40) }, base },
  ];
  assert.equal(
    ci.resolveUniquePullRequest(candidates, {
      headSha: sha,
      repoFullName: base.repo.full_name,
    }).number,
    2,
  );
  assert.equal(
    ci.resolveUniquePullRequest(candidates, {
      headSha: sha,
      repoFullName: base.repo.full_name,
      explicitNumber: 3,
    }),
    null,
  );
  assert.equal(
    ci.resolveUniquePullRequest(
      [...candidates, { number: 4, state: 'open', head: { sha }, base }],
      { headSha: sha, repoFullName: base.repo.full_name },
    ),
    null,
  );
});

test('falls back to commit-associated PRs when workflow_run has no PR payload', async () => {
  const sha = 'e'.repeat(40);
  const route = Symbol('associated');
  let fallbackCalled = false;
  const github = {
    rest: {
      repos: { listPullRequestsAssociatedWithCommit: route },
      pulls: {
        get: async ({ pull_number }) => ({
          data: {
            number: pull_number,
            state: 'open',
            head: { sha },
            base: { repo: { full_name: 'redhat-developer/rhdh-plugins' } },
          },
        }),
      },
    },
    paginate: async (method, options) => {
      assert.equal(method, route);
      assert.equal(options.commit_sha, sha);
      fallbackCalled = true;
      return [{ number: 91 }];
    },
  };
  const pr = await ci.findPullRequest({
    github,
    owner: 'redhat-developer',
    repo: 'rhdh-plugins',
    run: { head_sha: sha, pull_requests: [] },
  });
  assert.equal(fallbackCalled, true);
  assert.equal(pr.number, 91);
});

test('strictly parses durable markers and rejects reordered or malformed data', () => {
  const intake = ci.makeIntakeMarker({
    runId: 12,
    attempt: 1,
    headSha: 'a'.repeat(40),
    workspace: 'boost',
    mode: 'observe',
  });
  assert.deepEqual(ci.parseIntakeMarker(intake), {
    run_id: 12,
    run_attempt: 1,
    head_sha: 'a'.repeat(40),
    workspace: 'boost',
    mode: 'observe',
  });
  assert.equal(
    ci.parseIntakeMarker(
      intake.replace('run=12 attempt=1', 'attempt=1 run=12'),
    ),
    null,
  );

  const triage =
    '<!-- fullsend:ci-triage-result run=12 attempt=1 head=' +
    'b'.repeat(40) +
    ' workspace=boost category=repository_test confidence=high recommendation=repair -->';
  assert.equal(
    ci.parseTriageResultMarker(`text\n${triage}\ntext`).recommendation,
    'repair',
  );
  assert.equal(
    ci.parseTriageResultMarker(
      triage.replace('confidence=high', 'confidence=certain'),
    ),
    null,
  );
});

test('fork and trust decisions require an approved bot or write role', () => {
  assert.equal(ci.isTrustedPrAuthor('fullsend-ai-coder[bot]', null), true);
  assert.equal(ci.isTrustedPrAuthor('developer', 'write'), true);
  assert.equal(ci.isTrustedPrAuthor('developer', 'triage'), false);
  assert.equal(ci.isTrustedPrAuthor('dependabot[bot]', null), false);
});

test('counts only dedicated autonomous repair commits', () => {
  assert.equal(
    ci.countRepairCommits([
      { commit: { message: 'fix(ci-agent): repair test\n\nbody' } },
      { commit: { message: 'fix: human change' } },
      { commit: { message: 'fix(ci-agent): second strategy' } },
    ]),
    2,
  );
  assert.equal(
    ci.countCommittedRepairResults([
      {
        body: ci.makeFixResultMarker({
          runId: 1,
          attempt: 1,
          analyzedHeadSha: 'a'.repeat(40),
          commitSha: 'b'.repeat(40),
          outcome: 'committed',
          iteration: 1,
        }),
      },
      {
        body: ci.makeFixResultMarker({
          runId: 2,
          attempt: 1,
          analyzedHeadSha: 'b'.repeat(40),
          commitSha: 'c'.repeat(40),
          outcome: 'committed',
          iteration: 2,
        }),
      },
    ]),
    2,
  );
});

test('retry and fix markers preserve run attempt and iteration', () => {
  const retry = ci.makeRetryMarker({
    runId: 50,
    attempt: 1,
    headSha: 'c'.repeat(40),
  });
  assert.deepEqual(ci.parseRetryMarker(`${retry}\nretrying`), {
    run_id: 50,
    run_attempt: 1,
    head_sha: 'c'.repeat(40),
  });
  const fix = ci.makeFixResultMarker({
    runId: 50,
    attempt: 2,
    analyzedHeadSha: 'c'.repeat(40),
    commitSha: 'd'.repeat(40),
    outcome: 'committed',
    iteration: 2,
  });
  assert.equal(ci.parseFixResultMarker(fix).iteration, 2);
});
