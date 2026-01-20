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

import {
  getApplicationFromResource,
  PipelineRunLabel,
  PipelineRunResource,
  runStatus,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import {
  Commit,
  getSourceUrl,
  PipelineRunEventType,
  PipelineRunEventTypeLabel,
  PipelineRunType,
} from './pipeline-runs';

export const statuses = [
  runStatus.Running,
  runStatus['In Progress'],
  runStatus.Pending,
  runStatus.Succeeded,
  runStatus.Failed,
  runStatus.Cancelled,
  runStatus.Unknown,
];

export const getCommitSha = (pipelineRun: PipelineRunResource) =>
  pipelineRun?.metadata?.labels?.[PipelineRunLabel.COMMIT_LABEL] ||
  pipelineRun?.metadata?.labels?.[PipelineRunLabel.TEST_SERVICE_COMMIT] ||
  pipelineRun?.metadata?.annotations?.[PipelineRunLabel.COMMIT_ANNOTATION] ||
  pipelineRun?.metadata?.annotations?.[PipelineRunLabel.TEST_SERVICE_COMMIT];

export const createCommitObjectFromPLR = (
  plr: PipelineRunResource | null,
): Commit | null => {
  if (!plr || !getCommitSha(plr)) {
    return null;
  }
  const commitSHA = getCommitSha(plr);

  if (!commitSHA) {
    return null;
  }

  const commitBranch =
    plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_BRANCH_ANNOTATION] ??
    '';
  const commitUser =
    plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_USER_LABEL];
  const creationTime = plr.metadata?.creationTimestamp;
  const application = getApplicationFromResource(plr);
  const component = plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? '';
  const repoName =
    plr.metadata?.labels?.[PipelineRunLabel.COMMIT_REPO_URL_LABEL];
  const repoURL = getSourceUrl(plr);
  const repoOrg =
    plr.metadata?.labels?.[PipelineRunLabel.COMMIT_REPO_ORG_LABEL] ||
    plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_REPO_ORG_LABEL];
  const shaURL =
    plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_URL_ANNOTATION] ||
    `${repoURL}/commit/${commitSHA}`;
  const shaTitle =
    plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_SHA_TITLE_ANNOTATION] ||
    'manual build';
  const gitProvider =
    plr.metadata?.labels?.[PipelineRunLabel.COMMIT_PROVIDER_LABEL] ||
    plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_PROVIDER_LABEL];
  const pullRequestNumber =
    plr.metadata?.labels?.[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL] ?? '';
  const eventType = plr.metadata?.labels?.[
    PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL
  ] as keyof typeof PipelineRunEventTypeLabel;
  const isPullRequest =
    plr.metadata?.labels?.[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL] ===
    PipelineRunEventType.PULL;

  return {
    apiVersion: plr.apiVersion,
    apiGroup: plr.apiGroup,
    kind: plr.kind,
    cluster: plr.cluster,
    subcomponent: plr.subcomponent,
    metadata: {
      uid: `${commitSHA}-${application}`,
      name: `${commitSHA}-${application}`,
      namespace: plr.metadata?.namespace,
    },
    status: {
      startTime: plr.status?.startTime,
    },
    components: [component],
    user: commitUser,
    sha: commitSHA,
    shaURL,
    repoName,
    repoURL,
    repoOrg,
    gitProvider,
    branch: commitBranch,
    creationTime,
    pipelineRuns: [plr],
    application,
    shaTitle,
    eventType,
    isPullRequest,
    pullRequestNumber,
  };
};

const updateCommitObject = (
  plr: PipelineRunResource,
  commit: Commit,
): Commit => {
  const newCommit = commit;
  const creationTime = plr.metadata?.creationTimestamp;
  const component = plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? '';

  if (
    creationTime &&
    (!newCommit.creationTime ||
      new Date(creationTime).getTime() >
        new Date(newCommit.creationTime).getTime())
  ) {
    newCommit.creationTime = creationTime;
  }
  if (newCommit.components) {
    const compIndex = newCommit.components.indexOf(component);
    if (compIndex < 0) newCommit.components.push(component);
  } else {
    newCommit.components = [component];
  }
  newCommit.pipelineRuns.push(plr);
  return newCommit;
};

export const getCommitsFromPLRs = (
  plrList: PipelineRunResource[],
  limit?: number,
): Commit[] => {
  const commits: Commit[] = [];
  plrList.forEach(plr => {
    const commitSHA = getCommitSha(plr);
    const applicationName = getApplicationFromResource(plr);
    if (commitSHA) {
      const existingCommitIndex = commits.findIndex(
        commit =>
          commit.sha === commitSHA && commit.application === applicationName,
      );
      if (existingCommitIndex > -1) {
        commits[existingCommitIndex] = updateCommitObject(
          plr,
          commits[existingCommitIndex],
        );
      } else {
        const commitObj = createCommitObjectFromPLR(plr);
        if (commitObj) {
          commits.push(commitObj);
        }
      }
    }
  });
  const sortedCommits = commits
    .map(c => {
      const pipelineRuns = c.pipelineRuns.sort(
        (a, b) =>
          new Date((b.status?.startTime as string) || '').getTime() -
          new Date((a.status?.startTime as string) || '').getTime(),
      );
      return { ...c, pipelineRuns };
    })
    .sort(
      (a, b) =>
        new Date((b.creationTime as string) || '').getTime() -
        new Date((a.creationTime as string) || '').getTime(),
    );
  return limit && limit < sortedCommits.length
    ? sortedCommits.slice(0, limit)
    : sortedCommits;
};

export const getLatestCommitFromPipelineRuns = (
  pipelineruns?: PipelineRunResource[],
) => {
  if (!pipelineruns?.length) {
    return null;
  }
  return createCommitObjectFromPLR(pipelineruns[0]);
};

export const getCommitDisplayName = (commit: Commit): string =>
  commit.sha.slice(0, 7);

export const getCommitShortName = (commitName: string): string =>
  commitName.slice(0, 7);

export const showPLRType = (plr: PipelineRunResource): string | null => {
  if (!plr) {
    return null;
  }
  const runType = plr?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
  if (!runType) {
    return null;
  }
  if (runType === PipelineRunType.BUILD) {
    return 'Build';
  }
  if (runType === PipelineRunType.TEST) {
    return 'Integration test';
  }
  if (runType === PipelineRunType.RELEASE) {
    return 'Release';
  }
  return null;
};

export const showPLRMessage = (plr: PipelineRunResource): string | null => {
  const runType = plr?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
  if (!runType) {
    return null;
  }
  if (runType === PipelineRunType.BUILD) {
    return 'Build deploying';
  }
  if (runType === PipelineRunType.TEST) {
    return 'Testing';
  }
  if (runType === PipelineRunType.RELEASE) {
    return 'Releasing';
  }
  return null;
};

export const createRepoUrl = (commit: Commit): string | null => {
  if (commit.gitProvider !== 'github') {
    return null;
  }
  if (commit.repoURL) {
    return commit.repoURL;
  }
  if (commit.repoName && commit.repoOrg) {
    return `https://github.com/${commit.repoOrg}/${commit.repoName}`;
  }
  return null;
};

export const createRepoBranchURL = (commit: Commit): string | undefined => {
  const repoUrl = createRepoUrl(commit);
  if (commit.branch && repoUrl) {
    return `${repoUrl}/tree/${commit.branch}`;
  }
  return undefined;
};

export const createRepoPullRequestURL = (commit: Commit): string | null => {
  const repoURL = createRepoUrl(commit);
  if (commit.pullRequestNumber && repoURL) {
    return `${repoURL}/pull/${commit.pullRequestNumber}`;
  }
  return null;
};
