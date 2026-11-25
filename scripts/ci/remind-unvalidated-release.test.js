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
import test from 'node:test';
import {
  remind,
  unvalidatedPackages,
  versionedPackages,
  versionPackagesWorkspace,
} from './remind-unvalidated-release.js';

const repo = { full_name: 'redhat-developer/rhdh-plugins' };
const file = 'workspaces/boost/plugins/frontend/package.json';
const other = 'workspaces/boost/plugins/other/package.json';
const added = 'workspaces/boost/plugins/new/package.json';
const privatePackage = 'workspaces/boost/packages/app/package.json';
const cutoff = '2026-11-25T16:52:45Z';
const pr = (base = 'main', head = 'changesets-release/boost/main') => ({
  number: 42,
  title: 'Version Packages (boost)',
  user: { login: 'rhdh-bot' },
  base: { ref: base, repo, sha: 'base-sha' },
  head: { ref: head, repo, sha: 'head-sha' },
  merged_at: '2026-11-26T00:00:00Z',
  merge_commit_sha: 'release-sha',
});
const run = {
  id: 1,
  status: 'completed',
  created_at: '2026-11-26T00:00:00Z',
  head_sha: 'release-sha',
};
const payload = (name, version, isPrivate = false) => ({
  type: 'file',
  content: Buffer.from(
    JSON.stringify({ name, version, private: isPrivate }),
  ).toString('base64'),
});

function mockGithub({
  files = [],
  manifests = {},
  runs = [],
  jobs = [],
  prs = [],
  comments = [],
} = {}) {
  const posted = [];
  const state = { pagesRead: 0 };
  const rest = {
    pulls: { listFiles() {} },
    actions: { listWorkflowRuns() {}, listJobsForWorkflowRun() {} },
    repos: {
      listPullRequestsAssociatedWithCommit() {},
      async getContent({ path, ref }) {
        const data = manifests[`${ref}:${path}`];
        if (!data) throw Object.assign(new Error('Not Found'), { status: 404 });
        return { data };
      },
    },
    issues: {
      listComments() {},
      createComment: async comment => posted.push(comment),
    },
  };
  async function paginate(method) {
    if (method === rest.pulls.listFiles) return files;
    if (method === rest.actions.listJobsForWorkflowRun) return jobs;
    if (method === rest.repos.listPullRequestsAssociatedWithCommit) return prs;
    if (method === rest.issues.listComments) return comments;
    throw new Error('Unexpected API request');
  }
  paginate.iterator = async function* listRunPages(method) {
    assert.equal(method, rest.actions.listWorkflowRuns);
    for (const result of runs) {
      state.pagesRead++;
      yield { data: [result] };
    }
  };
  return { rest, posted, state, paginate };
}
const registry = times => async url => {
  const name = decodeURIComponent(url.split('/').pop());
  return times[name]
    ? { status: 200, ok: true, json: async () => ({ name, time: times[name] }) }
    : { status: 404, ok: false };
};

const manifests = {
  [`base-sha:${file}`]: payload('@example/frontend', '1.0.0'),
  [`head-sha:${file}`]: payload('@example/frontend', '1.0.1'),
  [`base-sha:${other}`]: payload('@example/other', '1.0.0'),
  [`head-sha:${other}`]: payload('@example/other', '1.0.0'),
  [`head-sha:${added}`]: payload('@example/new', '0.1.0'),
  [`base-sha:${privatePackage}`]: payload('@example/app', '1.0.0', true),
  [`head-sha:${privatePackage}`]: payload('@example/app', '1.0.1', true),
  [`release-sha:${file}`]: payload('@example/frontend', '1.0.0'),
};

test('recognizes main and maintenance bot PRs, not forks', () => {
  assert.equal(versionPackagesWorkspace(pr()).workflow, 'release.yml');
  assert.equal(
    versionPackagesWorkspace(
      pr('release-2.1', 'maintenance-changesets-release/release-2.1/boost'),
    ).workflow,
    'release_workspace_version.yml',
  );
  assert.equal(
    versionPackagesWorkspace(
      pr(
        'release-1.10/boost',
        'maintenance-changesets-release/release-1.10/boost',
      ),
    ).workspace,
    'boost',
  );
  assert.equal(
    versionPackagesWorkspace({
      ...pr(),
      head: {
        ref: 'changesets-release/boost/main',
        repo: { full_name: 'other/repo' },
      },
    }),
    null,
  );
});

test('checks only public package version changes, including new packages', async () => {
  const github = mockGithub({
    files: [file, other, added, privatePackage].map(filename => ({
      filename,
      status: filename === added ? 'added' : 'modified',
    })),
    manifests,
  });
  assert.deepEqual(
    await versionedPackages(
      github,
      'redhat-developer',
      'rhdh-plugins',
      pr(),
      'boost',
    ),
    [
      { name: '@example/frontend', path: file },
      { name: '@example/new', path: added },
    ],
  );
});

test('a main publish does not validate the prior-version workflow', async () => {
  const target = versionPackagesWorkspace(
    pr('release-2.1', 'maintenance-changesets-release/release-2.1/boost'),
  );
  const packages = [{ name: '@example/frontend', path: file }];
  const request = registry({
    '@example/frontend': { '1.0.0': '2026-11-26T00:05:00Z' },
  });
  const args = {
    owner: 'redhat-developer',
    repo: 'rhdh-plugins',
    target,
    packages,
    cutoff,
    request,
  };
  assert.deepEqual(
    await unvalidatedPackages({
      ...args,
      github: mockGithub({
        runs: [run],
        jobs: [
          {
            name: 'Maybe release boost / Release workspace boost',
            conclusion: 'success',
          },
        ],
        prs: [pr()],
        manifests,
      }),
    }),
    ['@example/frontend'],
  );
  const maintenance = pr(
    'release-2.1',
    'maintenance-changesets-release/release-2.1/boost',
  );
  assert.deepEqual(
    await unvalidatedPackages({
      ...args,
      github: mockGithub({
        runs: [run],
        jobs: [{ name: 'Publish workspace', conclusion: 'success' }],
        prs: [maintenance],
        manifests,
      }),
    }),
    [],
  );
});

test('skipped jobs, unrelated PRs and old publish timestamps cannot validate a package', async () => {
  const target = versionPackagesWorkspace(pr());
  const args = {
    owner: 'redhat-developer',
    repo: 'rhdh-plugins',
    target,
    packages: [{ name: '@example/frontend', path: file }],
    cutoff,
  };
  const jobs = [
    {
      name: 'Maybe release boost / Release workspace boost',
      conclusion: 'success',
    },
  ];
  assert.deepEqual(
    await unvalidatedPackages({
      ...args,
      request: registry({
        '@example/frontend': { '1.0.0': '2026-11-25T00:00:00Z' },
      }),
      github: mockGithub({ runs: [run], jobs, prs: [pr()], manifests }),
    }),
    ['@example/frontend'],
  );
  assert.deepEqual(
    await unvalidatedPackages({
      ...args,
      request: registry({
        '@example/frontend': { '1.0.0': '2026-11-26T00:05:00Z' },
      }),
      github: mockGithub({ runs: [run], jobs, prs: [], manifests }),
    }),
    ['@example/frontend'],
  );
});

test('comments once when a PR versions a package with no matching publish', async () => {
  const github = mockGithub({
    files: [{ filename: file, status: 'modified' }],
    manifests,
  });
  const args = {
    github,
    owner: 'redhat-developer',
    repo: 'rhdh-plugins',
    pr: pr(),
    cutoff,
    request: registry({
      '@example/frontend': { '1.0.0': '2026-11-26T00:05:00Z' },
    }),
  };
  assert.deepEqual(await remind(args), ['@example/frontend']);
  assert.match(github.posted[0].body, /@redhat-developer\/rhdh-cope/);
  const again = mockGithub({
    files: [{ filename: file, status: 'modified' }],
    manifests,
    comments: github.posted,
  });
  assert.deepEqual(await remind({ ...args, github: again }), [
    '@example/frontend',
  ]);
  assert.equal(again.posted.length, 0);
});

test('skips the Actions API when npm has no post-cutover versions', async () => {
  const github = mockGithub({ runs: [run] });
  const target = versionPackagesWorkspace(pr());
  const missing = await unvalidatedPackages({
    github,
    owner: 'redhat-developer',
    repo: 'rhdh-plugins',
    target,
    packages: [{ name: '@example/frontend', path: file }],
    cutoff,
    request: registry({
      '@example/frontend': { '1.0.0': '2026-11-24T00:00:00Z' },
    }),
  });
  assert.deepEqual(missing, ['@example/frontend']);
  assert.equal(github.state.pagesRead, 0);
});

test('stops paging release runs when all packages are validated', async () => {
  const github = mockGithub({
    runs: [run, { ...run, id: 2 }],
    jobs: [
      {
        name: 'Maybe release boost / Release workspace boost',
        conclusion: 'success',
      },
    ],
    prs: [pr()],
    manifests,
  });
  const target = versionPackagesWorkspace(pr());
  const missing = await unvalidatedPackages({
    github,
    owner: 'redhat-developer',
    repo: 'rhdh-plugins',
    target,
    packages: [{ name: '@example/frontend', path: file }],
    cutoff,
    request: registry({
      '@example/frontend': { '1.0.0': '2026-11-26T00:05:00Z' },
    }),
  });
  assert.deepEqual(missing, []);
  assert.equal(github.state.pagesRead, 1);
});

test('registry errors fail closed', async () => {
  const target = versionPackagesWorkspace(pr());
  await assert.rejects(
    unvalidatedPackages({
      github: mockGithub(),
      owner: 'redhat-developer',
      repo: 'rhdh-plugins',
      target,
      packages: [{ name: '@example/frontend', path: file }],
      cutoff,
      request: async () => ({ status: 503, ok: false }),
    }),
    /503/,
  );
});
