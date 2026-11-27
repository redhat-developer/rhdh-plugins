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

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

const sourceRepository = 'redhat-developer/rhdh-plugins';
const overlays = {
  owner: 'redhat-developer',
  repo: 'rhdh-plugin-export-overlays',
};
const npmRegistry = 'https://registry.npmjs.org';

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? '');
  return match ? match.slice(1, 4).map(Number) : undefined;
}

// Mirrors overlays' backstage-version-compatible.sh: the same minor line, or an
// older minor on the same major line. A newer source is never selected.
function isBackstageCompatible(source, target) {
  const sourceVersion = parseVersion(source);
  const targetVersion = parseVersion(target);
  if (!sourceVersion || !targetVersion) return true;
  const [sourceMajor, sourceMinor] = sourceVersion;
  const [targetMajor, targetMinor] = targetVersion;
  return sourceMajor === targetMajor && sourceMinor <= targetMinor;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function listPublicPackages(workspaceDir) {
  const root = await readJson(path.join(workspaceDir, 'package.json'));
  const patterns = Array.isArray(root.workspaces)
    ? root.workspaces
    : (root.workspaces?.packages ?? []);
  const dirs = patterns.length ? [] : [workspaceDir];
  for (const pattern of patterns) {
    if (!pattern.endsWith('/*')) {
      dirs.push(path.join(workspaceDir, pattern));
      continue;
    }
    const parent = path.join(workspaceDir, pattern.slice(0, -2));
    const entries = await readdir(parent, { withFileTypes: true }).catch(
      () => [],
    );
    for (const entry of entries) {
      if (entry.isDirectory()) dirs.push(path.join(parent, entry.name));
    }
  }
  const packages = [];
  for (const dir of dirs) {
    const pkg = await readJson(path.join(dir, 'package.json')).catch(
      () => undefined,
    );
    if (pkg?.name && pkg.version && !pkg.private) {
      packages.push({ name: pkg.name, version: pkg.version });
    }
  }
  return packages;
}

async function report(core, message) {
  core.warning(message);
  await core.summary
    ?.addRaw(`> [!WARNING]\n> ${message}\n\n`)
    .write()
    .catch(() => {});
}

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

async function findReleasePr({
  github,
  repo,
  sha,
  workspace,
  branch,
  versionBranch,
}) {
  const prs = await github.paginate(
    github.rest.repos.listPullRequestsAssociatedWithCommit,
    { ...repo, commit_sha: sha, per_page: 100 },
  );
  const releases = prs.filter(
    pr =>
      pr.merged_at &&
      pr.merge_commit_sha === sha &&
      pr.title === `Version Packages (${workspace})` &&
      pr.user.login === 'rhdh-bot' &&
      pr.base.ref === branch &&
      pr.base.repo.full_name === sourceRepository &&
      pr.head.ref === versionBranch &&
      pr.head.repo?.full_name === sourceRepository,
  );
  return releases.length === 1 ? releases[0] : undefined;
}

// The packages are already on npm when this runs, so a follow-up problem must
// not mark the release as failed. Every error is reported as a warning instead.
export async function updateOverlays(options) {
  try {
    await runUpdate(options);
  } catch (error) {
    if (error?.stack) options.core.info(error.stack);
    await report(
      options.core,
      `Overlays follow-up for ${options.workspace} did not complete: ${error?.message ?? error}`,
    );
  }
}

async function runUpdate({
  github,
  context,
  core,
  workspace,
  branch,
  wait = setTimeout,
  attempts = 120,
  interval = 15_000,
  fetch = globalThis.fetch,
  repoRoot = process.env.GITHUB_WORKSPACE ?? process.cwd(),
  npmAttempts = 40,
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
  const release = await findReleasePr({
    github,
    repo: context.repo,
    sha: context.sha,
    workspace,
    branch,
    versionBranch,
  });
  if (!release) {
    throw new Error(
      'Expected exactly one merged, bot-authored Version Packages PR for this release.',
    );
  }

  async function verifyNewerRelease(sourceSha) {
    try {
      const { data } = await github.rest.repos.compareCommits({
        ...context.repo,
        base: context.sha,
        head: sourceSha,
      });
      if (data.status !== 'ahead') return false;
      return Boolean(
        await findReleasePr({
          github,
          repo: context.repo,
          sha: sourceSha,
          workspace,
          branch,
          versionBranch,
        }),
      );
    } catch (error) {
      if (error.status === 404) return false;
      throw error;
    }
  }

  const newerReleases = new Map();
  async function coversRelease(source) {
    if (repositoryName(source?.repo) !== sourceRepository) return false;
    const sourceSha = source['repo-ref'];
    if (sourceSha === context.sha) return true;
    if (!/^[a-f0-9]{40}$/.test(sourceSha)) return false;
    if (!newerReleases.has(sourceSha)) {
      newerReleases.set(sourceSha, verifyNewerRelease(sourceSha));
    }
    return newerReleases.get(sourceSha);
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
    await report(
      core,
      `Skipping ${workspace}: no rhdh-plugins workspace in overlays on ${targetBranch}.`,
    );
    return;
  }

  async function readTargetBackstageVersion() {
    const { data } = await github.rest.repos.getContent({
      ...overlays,
      path: 'versions.json',
      ref: targetBranch,
    });
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'))
      .backstage;
  }

  // Overlays never selects a release built on a newer Backstage than the
  // target branch supports, so dispatching would only end without a PR.
  async function checkBackstageVersion() {
    const workspaceDir = path.join(repoRoot, 'workspaces', workspace);
    const { version: sourceVersion } = await readJson(
      path.join(workspaceDir, 'backstage.json'),
    );
    const targetVersion = await readTargetBackstageVersion();
    if (isBackstageCompatible(sourceVersion, targetVersion)) return true;
    await report(
      core,
      `Skipping ${workspace}: it uses Backstage ${sourceVersion}, but overlays ${targetBranch} supports Backstage ${targetVersion}. Overlays picks up this release once its Backstage version catches up.`,
    );
    return false;
  }

  // npm publish returns before the registry lists the new versions. Overlays
  // discovery reads the registry, so dispatching too early keeps the old commit.
  async function waitForNpm() {
    const workspaceDir = path.join(repoRoot, 'workspaces', workspace);
    let missing = await listPublicPackages(workspaceDir);
    for (let attempt = 0; attempt < npmAttempts && missing.length; attempt++) {
      if (attempt > 0) await wait(interval);
      const results = await Promise.all(
        missing.map(async pkg => {
          try {
            const response = await fetch(
              `${npmRegistry}/${pkg.name.replace('/', '%2F')}`,
              { headers: { accept: 'application/json' } },
            );
            if (!response.ok) return false;
            const data = await response.json();
            return Boolean(data.versions?.[pkg.version]);
          } catch {
            return false;
          }
        }),
      );
      missing = missing.filter((_, index) => !results[index]);
    }
    if (missing.length) {
      await report(
        core,
        `npm does not list ${missing.map(pkg => `${pkg.name}@${pkg.version}`).join(', ')} yet; dispatching the overlays update anyway.`,
      );
    }
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
      if (await coversRelease(source)) {
        return { pr, sourceSha: source['repo-ref'] };
      }
    }
    return undefined;
  }

  async function comment({ pr, sourceSha }) {
    const marker = `<!-- rhdh-overlays-update:${workspace}:${context.sha} -->`;
    const link = `Overlays update for \`${targetBranch}\`: ${pr.html_url}`;
    const lines = [
      marker,
      `Published \`${workspace}\` from commit \`${context.sha}\`.`,
      '',
    ];
    if (sourceSha !== context.sha) {
      lines.push(
        `The overlays PR tracks newer Version Packages commit \`${sourceSha}\`, which includes this release in its history.`,
        '',
      );
    }
    lines.push(link);
    const body = lines.join('\n');
    const issue = { ...context.repo, issue_number: release.number };
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...issue,
      per_page: 100,
    });
    if (
      !comments.some(existing => {
        const content = new Set(existing.body?.split(/\r?\n/) ?? []);
        return content.has(marker) && content.has(link);
      })
    ) {
      await github.rest.issues.createComment({ ...issue, body });
    }
    core.info(`Overlays PR: ${pr.html_url}`);
  }

  async function waitForPullRequest(dispatch) {
    let lastRun;
    let reportedCompletion = false;
    const noPrError = () =>
      new Error(
        `Overlays run finished (${lastRun.conclusion}) without a PR for ${context.sha}: ${dispatch.html_url}`,
      );
    for (let attempt = 0; attempt < attempts; attempt++) {
      await wait(interval);
      const { data } = await github.rest.actions.getWorkflowRun({
        ...overlays,
        run_id: dispatch.workflow_run_id,
      });
      lastRun = data;
      const match = await findMatchingPullRequest(await findPullRequests());
      if (match) return match;
      if (lastRun.status !== 'completed') continue;
      if (!['success', 'cancelled'].includes(lastRun.conclusion))
        throw noPrError();
      // A newer workspace update can supersede this dispatch. Keep this
      // release's follow-up alive until that update can be reconciled.
      if (!reportedCompletion) {
        core.warning(
          `Overlays run ${lastRun.conclusion}; waiting for a matching or verified newer release PR: ${dispatch.html_url}`,
        );
        reportedCompletion = true;
      }
    }
    if (lastRun?.status === 'completed') throw noPrError();
    throw new Error(
      `Timed out waiting for an overlays PR for ${context.sha}: ${dispatch.html_url}`,
    );
  }

  const existingPrs = await findPullRequests();
  const existingMatch = await findMatchingPullRequest(existingPrs);
  if (existingMatch) {
    await comment(existingMatch);
    return;
  }

  if (!(await checkBackstageVersion())) return;
  await waitForNpm();

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

  await comment(await waitForPullRequest(dispatch));
}
