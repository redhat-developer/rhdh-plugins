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

import { setTimeout } from 'node:timers/promises';

const sourceRepository = 'redhat-developer/rhdh-plugins';
const overlays = {
  owner: 'redhat-developer',
  repo: 'rhdh-plugin-export-overlays',
};

function repositoryName(url) {
  return url
    ?.replace(/^https:\/\/github\.com\//, '')
    .replace(/\/$/, '')
    .replace(/\.git$/, '');
}

function releaseBranches(workspace, branch) {
  if (branch === 'main') {
    return {
      targetBranch: branch,
      versionBranch: `changesets-release/${workspace}/main`,
    };
  }

  // Legacy releases use release-1.x/<workspace>; overlays uses release-1.x.
  const legacy = branch.match(/^release-1\.\d+\/([^/]+)$/);
  if (legacy?.[1] === workspace) {
    return {
      targetBranch: branch.split('/')[0],
      versionBranch: `maintenance-changesets-release/${branch}`,
    };
  }

  if (/^release-(?:[2-9]|[1-9]\d+)\.\d+$/.test(branch)) {
    return {
      targetBranch: branch,
      versionBranch: `maintenance-changesets-release/${branch}/${workspace}`,
    };
  }

  throw new Error(`Unsupported release branch: ${branch}`);
}

export async function updateOverlays({
  github,
  context,
  core,
  workspace,
  branch,
  wait = setTimeout,
  attempts = 120,
  interval = 15_000,
}) {
  if (`${context.repo.owner}/${context.repo.repo}` !== sourceRepository) {
    throw new Error(
      'Overlays updates must run from the upstream rhdh-plugins repository.',
    );
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(workspace)) {
    throw new Error(`Invalid workspace: ${workspace}`);
  }

  const { targetBranch, versionBranch } = releaseBranches(workspace, branch);

  // Resolve by the merge commit, never by title alone or the latest closed PR.
  const releasePrs = await github.paginate(
    github.rest.repos.listPullRequestsAssociatedWithCommit,
    { ...context.repo, commit_sha: context.sha, per_page: 100 },
  );
  const releases = releasePrs.filter(
    pr =>
      pr.merged_at &&
      pr.merge_commit_sha === context.sha &&
      pr.title === `Version Packages (${workspace})` &&
      pr.user.login === 'rhdh-bot' &&
      pr.base.ref === branch &&
      pr.base.repo.full_name === sourceRepository &&
      pr.head.ref === versionBranch &&
      pr.head.repo?.full_name === sourceRepository,
  );
  if (releases.length !== 1) {
    throw new Error(
      'Expected exactly one merged, bot-authored Version Packages PR for this release.',
    );
  }

  async function readSource(ref) {
    try {
      const { data } = await github.rest.repos.getContent({
        ...overlays,
        path: `workspaces/${workspace}/source.json`,
        ref,
      });
      if (data.type !== 'file' || data.encoding !== 'base64') {
        throw new Error(`Expected a source.json file at ${ref}.`);
      }
      return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    } catch (error) {
      if (error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  const baseSource = await readSource(targetBranch);
  if (repositoryName(baseSource?.repo) !== sourceRepository) {
    core.warning(
      `Skipping ${workspace}: no rhdh-plugins workspace in overlays on ${targetBranch}.`,
    );
    return;
  }

  const prBranch = `workspaces/${targetBranch}__${workspace}`;
  async function findPullRequests() {
    const prs = await github.paginate(github.rest.pulls.list, {
      ...overlays,
      state: 'all',
      base: targetBranch,
      head: `${overlays.owner}:${prBranch}`,
      per_page: 100,
    });
    return prs.filter(
      pr =>
        pr.head.repo?.full_name === `${overlays.owner}/${overlays.repo}` &&
        pr.head.ref === prBranch &&
        pr.base.ref === targetBranch &&
        (pr.state === 'open' || pr.merged_at),
    );
  }

  const prSources = new Map();
  async function findMatchingPullRequest(prs) {
    for (const pr of prs) {
      // A timestamp or workspace name is not enough: verify the actual source
      // at the PR's immutable head SHA, including on reruns after it was merged.
      // Cache immutable contents so polling doesn't repeatedly read old PRs.
      let source = prSources.get(pr.head.sha);
      if (!source) {
        source = await readSource(pr.head.sha);
        if (source) prSources.set(pr.head.sha, source);
      }
      if (
        repositoryName(source?.repo) === sourceRepository &&
        source['repo-ref'] === context.sha
      ) {
        return pr;
      }
    }
    return undefined;
  }

  async function comment(pr) {
    const body = [
      `<!-- rhdh-overlays-update:${workspace}:${context.sha} -->`,
      `Published \`${workspace}\` from commit \`${context.sha}\`.`,
      '',
      `Overlays update for \`${targetBranch}\`: ${pr.html_url}`,
    ].join('\n');
    const issue = { ...context.repo, issue_number: releases[0].number };
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...issue,
      per_page: 100,
    });
    if (!comments.some(existing => existing.body === body)) {
      await github.rest.issues.createComment({ ...issue, body });
    }
    core.info(`Overlays PR: ${pr.html_url}`);
  }

  const existingPrs = await findPullRequests();
  const existingMatch = await findMatchingPullRequest(existingPrs);
  if (existingMatch) {
    await comment(existingMatch);
    return;
  }

  const openPr = existingPrs.find(pr => pr.state === 'open');
  const inputs = {
    'workspace-path': `workspaces/${workspace}`,
    'single-branch': targetBranch,
  };
  if (openPr) {
    // Without this input the updater only labels an existing stale PR and asks
    // a human to refresh it. Reuse the PR rather than opening a duplicate.
    inputs['pr-to-update'] = String(openPr.number);
  }
  const { data: dispatch } = await github.rest.actions.createWorkflowDispatch({
    ...overlays,
    workflow_id: 'update-plugins-repo-refs.yaml',
    ref: 'main',
    inputs,
    // This API version returns the dispatched run ID, so concurrent runs do
    // not need to be guessed from their start time or actor.
    headers: { 'X-GitHub-Api-Version': '2026-03-10' },
  });
  if (!dispatch?.workflow_run_id) {
    throw new Error('The overlays dispatch did not return a workflow run ID.');
  }
  core.info(`Overlays update run: ${dispatch.html_url}`);

  for (let attempt = 0; attempt < attempts; attempt++) {
    await wait(interval);
    const { data: run } = await github.rest.actions.getWorkflowRun({
      ...overlays,
      run_id: dispatch.workflow_run_id,
    });
    // Read PRs after run status, so a PR created while checking a finishing run
    // is not mistaken for a no-op update.
    const matchingPr = await findMatchingPullRequest(await findPullRequests());
    if (matchingPr) {
      await comment(matchingPr);
      return;
    }
    if (run.status === 'completed') {
      throw new Error(
        `Overlays run finished (${run.conclusion}) without a PR for ${context.sha}: ${dispatch.html_url}`,
      );
    }
  }
  throw new Error(
    `Timed out waiting for an overlays PR for ${context.sha}: ${dispatch.html_url}`,
  );
}
