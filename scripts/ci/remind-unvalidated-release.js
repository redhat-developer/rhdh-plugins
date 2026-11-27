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

const MARKER = '<!-- rhdh-trusted-publishing-validation -->';

export function versionPackagesWorkspace(pr) {
  if (
    pr.user.login !== 'rhdh-bot' ||
    pr.head.repo?.full_name !== pr.base.repo.full_name
  )
    return null;
  const workspace = /^Version Packages \(([a-z0-9][a-z0-9-]*)\)$/.exec(
    pr.title,
  )?.[1];
  if (!workspace) return null;
  const base = pr.base.ref;
  if (
    base === 'main' &&
    pr.head.ref === `changesets-release/${workspace}/main`
  ) {
    return { workspace, base, workflow: 'release.yml' };
  }
  if (
    /^release-\d+\.\d+$/.test(base) &&
    pr.head.ref === `maintenance-changesets-release/${base}/${workspace}`
  ) {
    return { workspace, base, workflow: 'release_workspace_version.yml' };
  }
  if (
    /^release-1\.\d+\/[^/]+$/.test(base) &&
    base.endsWith(`/${workspace}`) &&
    pr.head.ref === `maintenance-changesets-release/${base}`
  ) {
    return { workspace, base, workflow: 'release_workspace_version.yml' };
  }
  return null;
}

async function manifest(github, owner, repo, file, ref, allowMissing = false) {
  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo,
      path: file,
      ref,
    });
    if (data.type !== 'file' || !data.content)
      throw new Error(`No package.json content at ${file}@${ref}`);
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  } catch (error) {
    if (allowMissing && error.status === 404) return null;
    throw error;
  }
}

export async function versionedPackages(github, owner, repo, pr, workspace) {
  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr.number,
    per_page: 100,
  });
  const prefix = new RegExp(
    `^workspaces/${workspace}/(?:plugins|packages)/[^/]+/package\\.json$`,
  );
  const affected = [];
  for (const file of files) {
    if (
      !prefix.test(file.filename) ||
      !['added', 'modified'].includes(file.status)
    )
      continue;
    const after = await manifest(
      github,
      owner,
      repo,
      file.filename,
      pr.head.sha,
    );
    const before = await manifest(
      github,
      owner,
      repo,
      file.filename,
      pr.base.sha,
      true,
    );
    if (
      after.private ||
      !after.name ||
      !after.version ||
      after.version === before?.version
    )
      continue;
    affected.push({ name: after.name, path: file.filename });
  }
  return affected;
}

async function registryHistory(name, request) {
  const response = await request(
    `https://registry.npmjs.org/${encodeURIComponent(name)}`,
    {
      headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    },
  );
  if (response.status === 404) return {};
  if (!response.ok)
    throw new Error(`npm registry returned ${response.status} for ${name}`);
  const metadata = await response.json();
  if (metadata.name !== name || !metadata.time)
    throw new Error(`Missing publish history for ${name}`);
  return metadata.time;
}

export async function unvalidatedPackages({
  github,
  owner,
  repo,
  target,
  packages,
  cutoff,
  request = fetch,
}) {
  const since = Date.parse(cutoff);
  if (!Number.isFinite(since)) throw new Error(`Invalid cutover: ${cutoff}`);
  const history = new Map();
  const missing = new Set(packages.map(pkg => pkg.name));
  const candidates = new Set();
  for (const pkg of packages) {
    const times = await registryHistory(pkg.name, request);
    history.set(pkg.name, times);
    if (
      Object.entries(times).some(
        ([version, publishedAt]) =>
          version !== 'created' &&
          version !== 'modified' &&
          Date.parse(publishedAt) > since,
      )
    )
      candidates.add(pkg.name);
  }
  // No GitHub run can validate a package without a post-cutover npm version.
  if (!candidates.size) return [...missing];
  const pages = github.paginate.iterator(github.rest.actions.listWorkflowRuns, {
    owner,
    repo,
    workflow_id: target.workflow,
    branch: target.base,
    event: 'push',
    created: `>=${cutoff}`,
    per_page: 100,
  });
  for await (const page of pages) {
    for (const run of page.data) {
      if (run.status !== 'completed' || Date.parse(run.created_at) < since)
        continue;
      const jobs = await github.paginate(
        github.rest.actions.listJobsForWorkflowRun,
        {
          owner,
          repo,
          run_id: run.id,
          per_page: 100,
        },
      );
      const published = jobs.some(
        job =>
          job.conclusion === 'success' &&
          (target.workflow === 'release.yml'
            ? job.name.startsWith(
                `Maybe release ${target.workspace} / Release workspace `,
              )
            : [
                'Publish workspace',
                'LEGACY - Publish legacy workspace',
              ].includes(job.name)),
      );
      if (!published) continue;
      // A prior-version run does not name its workspace in the publish job. Verify
      // the merged bot PR for both paths so an unrelated release cannot count.
      const prs = await github.paginate(
        github.rest.repos.listPullRequestsAssociatedWithCommit,
        {
          owner,
          repo,
          commit_sha: run.head_sha,
          per_page: 100,
        },
      );
      if (
        !prs.some(
          pr =>
            pr.merged_at &&
            pr.merge_commit_sha === run.head_sha &&
            versionPackagesWorkspace(pr)?.workspace === target.workspace &&
            pr.base.ref === target.base,
        )
      )
        continue;
      for (const pkg of packages) {
        if (!candidates.has(pkg.name)) continue;
        const released = await manifest(
          github,
          owner,
          repo,
          pkg.path,
          run.head_sha,
          true,
        );
        const publishedAt = history.get(pkg.name)[released?.version];
        if (
          publishedAt &&
          Date.parse(publishedAt) >= Date.parse(run.created_at) &&
          Date.parse(publishedAt) > since
        ) {
          missing.delete(pkg.name);
          candidates.delete(pkg.name);
        }
      }
      if (!candidates.size) break;
    }
    if (!candidates.size) break;
  }
  return [...missing];
}

export async function remind({ github, owner, repo, pr, cutoff, request }) {
  const target = versionPackagesWorkspace(pr);
  if (!target || !cutoff) return [];
  const packages = await versionedPackages(
    github,
    owner,
    repo,
    pr,
    target.workspace,
  );
  if (!packages.length) return [];
  const missing = await unvalidatedPackages({
    github,
    owner,
    repo,
    target,
    packages,
    cutoff,
    request,
  });
  if (!missing.length) return [];
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pr.number,
    per_page: 100,
  });
  if (!comments.some(comment => comment.body?.includes(MARKER))) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr.number,
      body: `${MARKER}\nThese packages versioned by this PR have no confirmed publish through the \`${target.workflow}\` release path on \`${target.base}\` since the trusted-publishing cutover:\n\n${missing.map(name => `- \`${name}\``).join('\n')}\n\nPlease ping \`@rhdh-cope\` in \`#rhdh-plugins-ecosystem\` on Slack to verify the first token-free publish before merging, or explicitly agree to merge the first release despite this non-required check.`,
    });
  }
  return missing;
}
