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
'use strict';

const WORKSPACE_RE = /^[a-z0-9][a-z0-9-]{0,126}[a-z0-9]$|^[a-z0-9]$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const REPAIR_COMMIT_PREFIX = 'fix(ci-agent):';
const AGGREGATE_JOB = 'check all required jobs';
const TRIAGE_BOTS = new Set(['fullsend-ai-retro', 'fullsend-ai-retro[bot]']);
const APPROVED_PR_BOTS = new Set([
  'fullsend-ai-coder',
  'fullsend-ai-coder[bot]',
  'rhdh-bot',
  'rhdh-bot[bot]',
]);

function normalizeAutomationMode(value) {
  const mode = String(value || 'observe')
    .trim()
    .toLocaleLowerCase('en-US');
  return ['off', 'observe', 'repair'].includes(mode) ? mode : 'observe';
}

function recommendationForLabel(label) {
  if (label === 'fullsend-ci-retry' || label === 'retry') {
    return 'retry_once';
  }
  if (label === 'fullsend-ci-fix' || label === 'fix') {
    return 'repair';
  }
  return null;
}

function parseWorkspaceAllowlist(value) {
  return [
    ...new Set(
      String(value || 'boost,scorecard,ai-integrations')
        .split(',')
        .map(item => item.trim())
        .filter(item => WORKSPACE_RE.test(item)),
    ),
  ];
}

function failedLeafJobs(jobs) {
  const failedConclusions = new Set([
    'failure',
    'timed_out',
    'action_required',
  ]);
  return (jobs || [])
    .filter(
      job =>
        job &&
        job.name !== AGGREGATE_JOB &&
        failedConclusions.has(job.conclusion),
    )
    .map(job => ({
      id: Number(job.id),
      name: String(job.name || '').slice(0, 256),
      conclusion: job.conclusion,
      html_url: job.html_url || null,
      started_at: job.started_at || null,
      completed_at: job.completed_at || null,
      failed_steps: (job.steps || [])
        .filter(step => failedConclusions.has(step.conclusion))
        .map(step => ({
          number: Number(step.number),
          name: String(step.name || '').slice(0, 256),
          conclusion: step.conclusion,
        })),
    }));
}

function extractJobScope(jobs) {
  const parsed = [];
  const unscoped = [];
  for (const job of jobs || []) {
    let match = /^Workspace ([a-z0-9][a-z0-9-]*), CI step for node (\d+)$/.exec(
      job.name,
    );
    if (match) {
      parsed.push({ workspace: match[1], node: Number(match[2]), kind: 'ci' });
      continue;
    }
    match = /^Workspace ([a-z0-9][a-z0-9-]*), Verify step$/.exec(job.name);
    if (match) {
      parsed.push({ workspace: match[1], node: null, kind: 'verify' });
      continue;
    }
    unscoped.push(job.name);
  }

  if (!parsed.length) {
    return {
      workspace: null,
      node_versions: [],
      deterministic: false,
      reason: 'no_workspace_job',
    };
  }
  if (unscoped.length) {
    return {
      workspace: null,
      node_versions: [],
      deterministic: false,
      reason: 'root_or_unrecognized_job',
    };
  }
  const workspaces = [...new Set(parsed.map(item => item.workspace))];
  if (workspaces.length !== 1) {
    return {
      workspace: null,
      node_versions: [],
      deterministic: false,
      reason: 'multiple_workspaces',
    };
  }
  return {
    workspace: workspaces[0],
    node_versions: [
      ...new Set(parsed.map(item => item.node).filter(Boolean)),
    ].sort((a, b) => a - b),
    deterministic: true,
    reason: 'single_workspace',
  };
}

function resolveUniquePullRequest(
  pullRequests,
  { headSha, repoFullName, explicitNumber } = {},
) {
  const explicit = explicitNumber ? Number(explicitNumber) : null;
  const matches = (pullRequests || []).filter(pr => {
    if (!pr || !Number.isInteger(Number(pr.number))) return false;
    if (explicit && Number(pr.number) !== explicit) return false;
    if (pr.state !== 'open') return false;
    if (pr.head?.sha !== headSha) return false;
    return pr.base?.repo?.full_name === repoFullName;
  });
  return matches.length === 1 ? matches[0] : null;
}

function makeIntakeMarker({ runId, attempt, headSha, workspace, mode }) {
  return `<!-- fullsend:ci-intake run=${Number(runId)} attempt=${Number(attempt)} head=${headSha} workspace=${workspace || 'none'} mode=${mode} -->`;
}

function parseIntakeMarker(line) {
  const match =
    /^<!-- fullsend:ci-intake run=([1-9]\d*) attempt=([1-9]\d*) head=([\da-f]{40}) workspace=([a-z0-9-]+|none) mode=(off|observe|repair) -->$/.exec(
      String(line || '').trim(),
    );
  if (!match) return null;
  return {
    run_id: Number(match[1]),
    run_attempt: Number(match[2]),
    head_sha: match[3],
    workspace: match[4] === 'none' ? null : match[4],
    mode: match[5],
  };
}

function makeTriageResultMarker(result) {
  return `<!-- fullsend:ci-triage-result run=${Number(result.run.id)} attempt=${Number(result.run.attempt)} head=${result.pr.head_sha} workspace=${result.workspace_boundary.workspace || 'none'} category=${result.category} confidence=${result.confidence} recommendation=${result.recommendation} -->`;
}

function parseTriageResultMarker(body) {
  const lines = String(body || '').split(/\r?\n/);
  for (const raw of lines) {
    const match =
      /^<!-- fullsend:ci-triage-result run=([1-9]\d*) attempt=([1-9]\d*) head=([\da-f]{40}) workspace=([a-z0-9-]+|none) category=(\S+) confidence=(\S+) recommendation=(\S+) -->$/.exec(
        raw.trim(),
      );
    if (
      match &&
      [
        'repository_code',
        'repository_test',
        'flake',
        'external_infra',
        'unknown',
      ].includes(match[5]) &&
      ['high', 'medium', 'low'].includes(match[6]) &&
      ['repair', 'retry_once', 'needs_human', 'no_action'].includes(match[7])
    ) {
      return {
        run_id: Number(match[1]),
        run_attempt: Number(match[2]),
        head_sha: match[3],
        workspace: match[4] === 'none' ? null : match[4],
        category: match[5],
        confidence: match[6],
        recommendation: match[7],
      };
    }
  }
  return null;
}

function makeRetryMarker({ runId, attempt, headSha }) {
  return `<!-- fullsend:ci-retry run=${Number(runId)} attempt=${Number(attempt)} head=${headSha} -->`;
}

function parseRetryMarker(body) {
  const match =
    /^<!-- fullsend:ci-retry run=([1-9]\d*) attempt=([1-9]\d*) head=([\da-f]{40}) -->$/m.exec(
      String(body || ''),
    );
  return match
    ? {
        run_id: Number(match[1]),
        run_attempt: Number(match[2]),
        head_sha: match[3],
      }
    : null;
}

function makeFixDispatchMarker({ runId, attempt, headSha, iteration }) {
  return `<!-- fullsend:ci-fix-dispatch run=${Number(runId)} attempt=${Number(attempt)} head=${headSha} iteration=${Number(iteration)} -->`;
}

function makeFixResultMarker({
  runId,
  attempt,
  analyzedHeadSha,
  commitSha,
  outcome,
  iteration,
}) {
  return `<!-- fullsend:ci-fix-result run=${Number(runId)} attempt=${Number(attempt)} head=${analyzedHeadSha} commit=${commitSha || 'none'} outcome=${outcome} iteration=${Number(iteration)} -->`;
}

function parseFixResultMarker(body) {
  const match =
    /^<!-- fullsend:ci-fix-result run=([1-9]\d*) attempt=([1-9]\d*) head=([\da-f]{40}) commit=([\da-f]{40}|none) outcome=(committed|blocked|no_change) iteration=([12]) -->$/m.exec(
      String(body || ''),
    );
  return match
    ? {
        run_id: Number(match[1]),
        run_attempt: Number(match[2]),
        analyzed_head_sha: match[3],
        commit_sha: match[4] === 'none' ? null : match[4],
        outcome: match[5],
        iteration: Number(match[6]),
      }
    : null;
}

function hasWriteRole(role) {
  return ['write', 'maintain', 'admin'].includes(
    String(role || '').toLocaleLowerCase('en-US'),
  );
}

function isTrustedPrAuthor(login, role) {
  return APPROVED_PR_BOTS.has(String(login || '')) || hasWriteRole(role);
}

function countRepairCommits(commits) {
  return (commits || []).filter(commit =>
    String(commit.commit?.message || '').startsWith(REPAIR_COMMIT_PREFIX),
  ).length;
}

function countCommittedRepairResults(comments) {
  return new Set(
    (comments || [])
      .map(comment => parseFixResultMarker(comment.body))
      .filter(marker => marker?.outcome === 'committed' && marker.commit_sha)
      .map(marker => marker.commit_sha),
  ).size;
}

function mdCode(value) {
  return String(value ?? '')
    .replace(/[\r\n\0]/g, ' ')
    .replaceAll('`', '\u02cb')
    .slice(0, 300);
}

async function listComments(github, owner, repo, issueNumber) {
  return github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });
}

async function findPullRequest({ github, owner, repo, run, explicitNumber }) {
  const numbers = new Set();
  if (explicitNumber) numbers.add(Number(explicitNumber));
  for (const pr of run.pull_requests || []) numbers.add(Number(pr.number));
  if (!numbers.size) {
    const associated = await github.paginate(
      github.rest.repos.listPullRequestsAssociatedWithCommit,
      {
        owner,
        repo,
        commit_sha: run.head_sha,
        per_page: 100,
      },
    );
    for (const pr of associated) numbers.add(Number(pr.number));
  }

  const pullRequests = [];
  for (const number of numbers) {
    if (!Number.isInteger(number) || number < 1) continue;
    try {
      const response = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: number,
      });
      pullRequests.push(response.data);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  return resolveUniquePullRequest(pullRequests, {
    headSha: run.head_sha,
    repoFullName: `${owner}/${repo}`,
    explicitNumber,
  });
}

async function getCompletedCiRun({ github, owner, repo, runId }) {
  const run = (
    await github.rest.actions.getWorkflowRun({ owner, repo, run_id: runId })
  ).data;
  if (run.name !== 'CI') {
    throw new Error(`Run ${runId} belongs to ${run.name}, not CI`);
  }
  if (run.status !== 'completed') {
    throw new Error(`Run ${runId} is not completed`);
  }
  if (!SHA_RE.test(run.head_sha || '')) {
    throw new Error(`Run ${runId} has an invalid head SHA`);
  }
  return run;
}

function isRepairableConclusion(conclusion) {
  return ['failure', 'timed_out'].includes(conclusion);
}

async function handleTerminalCiRun({
  github,
  owner,
  repo,
  pr,
  run,
  comments,
  core,
  dryRun,
  mode,
}) {
  if (run.conclusion === 'success') {
    if (!dryRun && mode !== 'off') {
      await maybePostRecovery({ github, owner, repo, pr, run, comments });
    }
    await core.summary
      .addRaw(`CI succeeded for PR #${pr.number}; no triage dispatched.`)
      .write();
    return true;
  }
  if (!isRepairableConclusion(run.conclusion)) {
    await core.summary
      .addRaw(
        `CI conclusion ${run.conclusion} is not repairable; no triage dispatched.`,
      )
      .write();
    return true;
  }
  return false;
}

async function listEvidenceArtifacts({ github, owner, repo, run }) {
  const artifacts = await github.paginate(
    github.rest.actions.listWorkflowRunArtifacts,
    {
      owner,
      repo,
      run_id: run.id,
      per_page: 100,
    },
  );
  const attempt = Number(run.run_attempt || 1);
  return artifacts
    .filter(
      artifact =>
        !artifact.expired &&
        String(artifact.name || '').startsWith('fullsend-ci-evidence-') &&
        String(artifact.name || '').endsWith(`-${run.id}-${attempt}`),
    )
    .map(artifact => ({
      id: Number(artifact.id),
      name: artifact.name,
      size_in_bytes: Number(artifact.size_in_bytes || 0),
    }));
}

function latestTriageResult(comments) {
  const triageComment = [...comments].reverse().find(comment => {
    return (
      TRIAGE_BOTS.has(comment.user?.login) &&
      parseTriageResultMarker(comment.body)
    );
  });
  return triageComment
    ? {
        comment: triageComment,
        result: parseTriageResultMarker(triageComment.body),
      }
    : null;
}

function isMatchingTriageHead(pr, triage) {
  return pr.state === 'open' && pr.head.sha === triage.head_sha;
}

function isMatchingTriageRun(run, triage) {
  return (
    run.name === 'CI' &&
    run.status === 'completed' &&
    isRepairableConclusion(run.conclusion) &&
    run.head_sha === triage.head_sha &&
    Number(run.run_attempt || 1) === triage.run_attempt
  );
}

function isTrustedWorkspaceRequest({
  triage,
  allowlist,
  sameRepository,
  trustedAuthor,
  noFix,
}) {
  return (
    sameRepository &&
    trustedAuthor &&
    !noFix &&
    Boolean(triage.workspace) &&
    allowlist.includes(triage.workspace)
  );
}

function isRepairDiagnosis(triage) {
  return (
    ['repository_code', 'repository_test'].includes(triage.category) &&
    triage.confidence === 'high' &&
    Boolean(triage.workspace)
  );
}

async function collaboratorRole(github, owner, repo, login) {
  if (!login) return null;
  try {
    const response = await github.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: login,
    });
    const role = response.data.role_name;
    return hasWriteRole(role) ? role : response.data.permission || role || null;
  } catch (error) {
    if ([403, 404].includes(error.status)) return null;
    throw error;
  }
}

async function ensureLabel(github, owner, repo, name, color, description) {
  try {
    await github.rest.issues.getLabel({ owner, repo, name });
  } catch (error) {
    if (error.status !== 404) throw error;
    await github.rest.issues.createLabel({
      owner,
      repo,
      name,
      color,
      description,
    });
  }
}

async function addNeedsHuman({
  github,
  owner,
  repo,
  prNumber,
  reason,
  marker,
}) {
  await ensureLabel(
    github,
    owner,
    repo,
    'needs-human',
    'B60205',
    'Autonomous CI repair needs maintainer attention',
  );
  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: ['needs-human'],
  });
  const body = `${marker}\n### Fullsend CI repair stopped\n\n${reason}`;
  const comments = await listComments(github, owner, repo, prNumber);
  if (!comments.some(comment => String(comment.body || '').includes(marker))) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }
}

async function maybePostRecovery({ github, owner, repo, pr, run, comments }) {
  const fix = comments
    .map(comment => parseFixResultMarker(comment.body))
    .find(
      marker =>
        marker?.outcome === 'committed' && marker.commit_sha === run.head_sha,
    );
  if (!fix) return false;
  const marker = `<!-- fullsend:ci-recovery run=${Number(run.id)} attempt=${Number(run.run_attempt || 1)} head=${run.head_sha} -->`;
  if (comments.some(comment => String(comment.body || '').includes(marker)))
    return false;
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: `${marker}\n### CI recovered after autonomous repair\n\nCI passed at \`${run.head_sha.slice(0, 12)}\` after repair iteration ${fix.iteration}. The \`needs-human\` label, if present, was intentionally left unchanged.`,
  });
  return true;
}

async function prepareIntake({ github, context, core, env = process.env }) {
  const { owner, repo } = context.repo;
  const mode = normalizeAutomationMode(env.FULLSEND_CI_AUTOMATION);
  const allowlist = parseWorkspaceAllowlist(env.FULLSEND_CI_AUTOFIX_WORKSPACES);
  const dryRun =
    String(env.FULLSEND_CI_DRY_RUN || 'false').toLocaleLowerCase('en-US') ===
    'true';
  const eventRun = context.payload.workflow_run;
  const runId = Number(eventRun?.id || env.FULLSEND_CI_RUN_ID);
  const explicitPr = env.FULLSEND_CI_PR_NUMBER
    ? Number(env.FULLSEND_CI_PR_NUMBER)
    : null;
  const emptyMatrix = JSON.stringify({ include: [] });
  core.setOutput('matrix', emptyMatrix);
  core.setOutput('pr_number', '');
  core.setOutput('head_sha', '');
  if (!Number.isInteger(runId) || runId < 1)
    throw new Error('A valid CI workflow run ID is required');

  const run = await getCompletedCiRun({ github, owner, repo, runId });

  const pr = await findPullRequest({
    github,
    owner,
    repo,
    run,
    explicitNumber: explicitPr,
  });
  if (!pr) {
    core.warning(
      `Run ${runId} did not resolve to exactly one open, head-matching PR`,
    );
    return;
  }
  core.setOutput('pr_number', String(pr.number));
  core.setOutput('head_sha', run.head_sha);
  const comments = await listComments(github, owner, repo, pr.number);

  if (
    await handleTerminalCiRun({
      github,
      owner,
      repo,
      pr,
      run,
      comments,
      core,
      dryRun,
      mode,
    })
  )
    return;

  const jobsResponse = await github.paginate(
    github.rest.actions.listJobsForWorkflowRun,
    {
      owner,
      repo,
      run_id: runId,
      filter: 'latest',
      per_page: 100,
    },
  );
  const failedJobs = failedLeafJobs(jobsResponse);
  const scope = extractJobScope(failedJobs);
  const attempt = Number(run.run_attempt || 1);
  const marker = makeIntakeMarker({
    runId,
    attempt,
    headSha: run.head_sha,
    workspace: scope.workspace,
    mode,
  });
  const evidenceArtifacts = await listEvidenceArtifacts({
    github,
    owner,
    repo,
    run,
  });
  const role = await collaboratorRole(github, owner, repo, pr.user?.login);
  const commits = await github.paginate(github.rest.pulls.listCommits, {
    owner,
    repo,
    pull_number: pr.number,
    per_page: 100,
  });
  const priorRepairCommits = Math.max(
    countRepairCommits(commits),
    countCommittedRepairResults(comments),
  );
  const sameRepository = pr.head?.repo?.full_name === `${owner}/${repo}`;
  const hasNoFix = (pr.labels || []).some(
    label => label.name === 'fullsend-no-fix',
  );
  const trustedAuthor = isTrustedPrAuthor(pr.user?.login, role);
  const mutationEligible =
    scope.deterministic &&
    allowlist.includes(scope.workspace) &&
    sameRepository &&
    trustedAuthor &&
    !hasNoFix &&
    priorRepairCommits < 2;

  const ciContext = {
    version: 1,
    kind: 'triage',
    automation_mode: mode,
    run_id: Number(run.id),
    run_attempt: attempt,
    run_url: run.html_url,
    head_sha: run.head_sha,
    conclusion: run.conclusion,
    failed_jobs: failedJobs,
    workspace_scope: scope,
    evidence_artifacts: evidenceArtifacts,
    trust: {
      same_repository: sameRepository,
      trusted_author: trustedAuthor,
      author_role: role,
      no_fix_label: hasNoFix,
      prior_repair_commits: priorRepairCommits,
      workspace_allowlisted: Boolean(
        scope.workspace && allowlist.includes(scope.workspace),
      ),
      mutation_eligible: mutationEligible,
    },
  };

  const auditBody = [
    marker,
    '### Fullsend CI intake',
    '',
    `Queued read-only diagnosis for [CI run ${run.id} (attempt ${attempt})](${run.html_url}) at \`${run.head_sha.slice(0, 12)}\`.`,
    '',
    `- Mode: \`${mode}\``,
    `- Workspace boundary: \`${scope.workspace || scope.reason}\``,
    `- Failed leaf jobs: ${failedJobs.length}`,
    ...failedJobs.map(job => {
      const failedSteps = job.failed_steps
        .map(step => `\`${mdCode(step.name)}\``)
        .join(', ');
      const failureDetail = failedSteps || `\`${job.conclusion}\``;
      return `  - \`${mdCode(job.name)}\`: ${failureDetail}`;
    }),
    `- Evidence artifacts: ${evidenceArtifacts.length}`,
    `- Mutation gate before diagnosis: \`${mutationEligible ? 'eligible' : 'diagnosis-only'}\``,
    '',
    '_Job names, logs, source, test names, and artifacts are treated as untrusted evidence._',
  ].join('\n');

  if (dryRun) {
    await core.summary
      .addHeading('Fullsend CI dry run')
      .addCodeBlock(JSON.stringify(ciContext, null, 2), 'json')
      .write();
    return;
  }
  if (mode === 'off') {
    await core.summary
      .addRaw(`FULLSEND_CI_AUTOMATION=off; run ${run.id} was ignored.`)
      .write();
    return;
  }
  if (!failedJobs.length) {
    core.warning(
      `Run ${run.id} has no failed leaf jobs after excluding the aggregate job`,
    );
    return;
  }
  if (comments.some(comment => String(comment.body || '').includes(marker))) {
    core.notice(`Intake ${marker} already exists; skipping duplicate dispatch`);
    return;
  }

  const auditComment = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pr.number,
    body: auditBody,
  });
  const payload = {
    action: 'ci_failure',
    repository: { full_name: `${owner}/${repo}` },
    sender: context.actor ? { login: context.actor } : undefined,
    pull_request: {
      number: pr.number,
      html_url: pr.html_url,
      state: pr.state,
      user: { login: pr.user?.login },
      head: {
        sha: pr.head.sha,
        ref: pr.head.ref,
        repo: { full_name: pr.head.repo?.full_name },
      },
      base: {
        sha: pr.base.sha,
        ref: pr.base.ref,
        repo: { full_name: pr.base.repo?.full_name },
      },
      labels: (pr.labels || []).map(label => ({ name: label.name })),
    },
    comment: { id: auditComment.data.id, html_url: auditComment.data.html_url },
    _fullsend_ci: ciContext,
  };
  const matrix = {
    include: [
      {
        agent: 'ci-triage',
        source_repo: `${owner}/${repo}`,
        role: 'retro',
        event_type: 'ci_failure',
        event_payload: JSON.stringify(payload),
        status_repo: `${owner}/${repo}`,
        status_number: String(pr.number),
      },
    ],
  };
  core.setOutput('matrix', JSON.stringify(matrix));
  await core.summary
    .addRaw(
      `Dispatched ci-triage for PR #${pr.number}, run ${run.id}, attempt ${attempt}.`,
    )
    .write();
}

async function prepareRepairDispatch({
  github,
  context,
  core,
  env = process.env,
}) {
  const { owner, repo } = context.repo;
  const emptyMatrix = JSON.stringify({ include: [] });
  core.setOutput('matrix', emptyMatrix);
  core.setOutput('operation', 'none');
  core.setOutput('pr_number', '');
  const mode = normalizeAutomationMode(env.FULLSEND_CI_AUTOMATION);
  const label = context.payload.label?.name || env.FULLSEND_CI_ACTION || '';
  const expectedRecommendation = recommendationForLabel(label);
  const prNumber = Number(
    context.payload.pull_request?.number || env.FULLSEND_CI_PR_NUMBER,
  );
  if (!expectedRecommendation || !Number.isInteger(prNumber) || prNumber < 1)
    return;
  core.setOutput('pr_number', String(prNumber));

  const pr = (
    await github.rest.pulls.get({ owner, repo, pull_number: prNumber })
  ).data;
  const comments = await listComments(github, owner, repo, prNumber);
  const latestTriage = latestTriageResult(comments);
  const triageComment = latestTriage?.comment;
  const triage = latestTriage?.result;
  const stopMarker = `<!-- fullsend:ci-needs-human head=${pr.head.sha} source=${expectedRecommendation} -->`;
  const stop = async reason =>
    addNeedsHuman({
      github,
      owner,
      repo,
      prNumber,
      reason,
      marker: stopMarker,
    });

  if (mode !== 'repair') return;
  if (!triage) {
    await stop(
      'No trusted, schema-validated triage result matches this dispatch label.',
    );
    return;
  }
  if (!isMatchingTriageHead(pr, triage)) {
    await stop('The PR is closed or its head changed after triage.');
    return;
  }
  if (triage.recommendation !== expectedRecommendation) {
    await stop(
      'The dispatch label does not match the trusted triage recommendation.',
    );
    return;
  }
  const run = (
    await github.rest.actions.getWorkflowRun({
      owner,
      repo,
      run_id: triage.run_id,
    })
  ).data;
  if (!isMatchingTriageRun(run, triage)) {
    await stop('The referenced CI run no longer matches the triage identity.');
    return;
  }

  const sameRepository = pr.head?.repo?.full_name === `${owner}/${repo}`;
  const noFix = (pr.labels || []).some(item => item.name === 'fullsend-no-fix');
  const role = await collaboratorRole(github, owner, repo, pr.user?.login);
  const trustedAuthor = isTrustedPrAuthor(pr.user?.login, role);
  const commits = await github.paginate(github.rest.pulls.listCommits, {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  const priorRepairCommits = Math.max(
    countRepairCommits(commits),
    countCommittedRepairResults(comments),
  );
  const allowlist = parseWorkspaceAllowlist(env.FULLSEND_CI_AUTOFIX_WORKSPACES);

  if (expectedRecommendation === 'retry_once') {
    if (
      !isTrustedWorkspaceRequest({
        triage,
        allowlist,
        sameRepository,
        trustedAuthor,
        noFix,
      })
    )
      return;
    const duplicate = comments
      .map(comment => parseRetryMarker(comment.body))
      .some(
        marker =>
          marker?.run_id === triage.run_id &&
          marker.head_sha === triage.head_sha,
      );
    if (triage.run_attempt !== 1 || duplicate) {
      await stop('The one permitted failed-jobs retry has already been used.');
      return;
    }
    await github.rest.actions.reRunWorkflowFailedJobs({
      owner,
      repo,
      run_id: triage.run_id,
    });
    const marker = makeRetryMarker({
      runId: triage.run_id,
      attempt: triage.run_attempt,
      headSha: triage.head_sha,
    });
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `${marker}\nRetrying failed CI jobs once for the high-confidence flake diagnosis.`,
    });
    core.setOutput('operation', 'retry');
    return;
  }

  if (!isRepairDiagnosis(triage)) {
    await stop(
      'Repair requires a high-confidence repository code/test diagnosis with one workspace.',
    );
    return;
  }
  if (
    !isTrustedWorkspaceRequest({
      triage,
      allowlist,
      sameRepository,
      trustedAuthor,
      noFix,
    })
  )
    return;
  if (priorRepairCommits >= 2) {
    await stop('The two-commit autonomous repair limit has been reached.');
    return;
  }
  const iteration = priorRepairCommits + 1;
  const dispatchMarker = makeFixDispatchMarker({
    runId: triage.run_id,
    attempt: triage.run_attempt,
    headSha: triage.head_sha,
    iteration,
  });
  if (
    comments.some(comment =>
      String(comment.body || '').includes(dispatchMarker),
    )
  )
    return;
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `${dispatchMarker}\nDispatching guarded CI repair iteration ${iteration} for \`workspaces/${triage.workspace}/\`.`,
  });

  const payload = {
    action: 'ci_fix',
    repository: { full_name: `${owner}/${repo}` },
    pull_request: {
      number: pr.number,
      html_url: pr.html_url,
      state: pr.state,
      user: { login: pr.user?.login },
      head: {
        sha: pr.head.sha,
        ref: pr.head.ref,
        repo: { full_name: pr.head.repo?.full_name },
      },
      base: {
        sha: pr.base.sha,
        ref: pr.base.ref,
        repo: { full_name: pr.base.repo?.full_name },
      },
      labels: (pr.labels || []).map(item => ({ name: item.name })),
    },
    comment: { id: triageComment.id, html_url: triageComment.html_url },
    _fullsend_ci: {
      version: 1,
      kind: 'fix',
      automation_mode: mode,
      run_id: triage.run_id,
      run_attempt: triage.run_attempt,
      head_sha: triage.head_sha,
      workspace: triage.workspace,
      iteration,
      category: triage.category,
      confidence: triage.confidence,
      recommendation: triage.recommendation,
    },
  };
  const matrix = {
    include: [
      {
        agent: 'ci-repair',
        source_repo: `${owner}/${repo}`,
        role: 'coder',
        event_type: 'ci_fix',
        event_payload: JSON.stringify(payload),
        status_repo: `${owner}/${repo}`,
        status_number: String(pr.number),
      },
    ],
  };
  core.setOutput('matrix', JSON.stringify(matrix));
  core.setOutput('operation', 'fix');
}

module.exports = {
  AGGREGATE_JOB,
  APPROVED_PR_BOTS,
  REPAIR_COMMIT_PREFIX,
  TRIAGE_BOTS,
  collaboratorRole,
  countCommittedRepairResults,
  countRepairCommits,
  extractJobScope,
  failedLeafJobs,
  findPullRequest,
  hasWriteRole,
  isTrustedPrAuthor,
  makeFixDispatchMarker,
  makeFixResultMarker,
  makeIntakeMarker,
  makeRetryMarker,
  makeTriageResultMarker,
  normalizeAutomationMode,
  recommendationForLabel,
  parseFixResultMarker,
  parseIntakeMarker,
  parseRetryMarker,
  parseTriageResultMarker,
  parseWorkspaceAllowlist,
  prepareIntake,
  prepareRepairDispatch,
  resolveUniquePullRequest,
};
