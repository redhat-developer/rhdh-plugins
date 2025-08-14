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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

// import { Octokit } from '@octokit/rest';

import { getCatalogFilename } from '../../catalog/catalogUtils';
import { logErrorIfNeeded } from '../../helpers';

export async function findOpenPRForBranch(
  logger: LoggerService,
  config: Config,
  gitlab: any,
  // octo: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  withCatalogInfoContent: boolean = false,
): Promise<{
  prNum?: number;
  prUrl?: string;
  prTitle?: string;
  prBody?: string;
  prCatalogInfoContent?: string;
  lastUpdate?: string;
}> {
  try {
    const response = await gitlab.MergeRequests.all({
      projectId: `${owner}/${repo}`,
      state: 'opened',
    });
    // const response = await octo.rest.pulls.list({
    //   owner: owner,
    //   repo: repo,
    //   state: 'open',
    // });
    for (const pull of response) {
      if (pull.source_branch === branchName) {
        return {
          prNum: pull.iid,
          prUrl: pull.web_url,
          prTitle: pull.title,
          prBody: pull.description ?? undefined,
          prCatalogInfoContent: withCatalogInfoContent
            ? await getCatalogInfoContentFromPR(
                logger,
                config,
                gitlab,
                owner,
                repo,
                pull.iid,
                pull.sha,
              )
            : undefined,
          lastUpdate: pull.updated_at,
        };
      }
    }
  } catch (error) {
    logErrorIfNeeded(logger, 'Error fetching pull requests', error);
  }
  return {};
}

async function getCatalogInfoContentFromPR(
  logger: LoggerService,
  config: Config,
  gitlab: any,
  owner: string,
  repo: string,
  prNumber: number,
  prHeadSha: string,
): Promise<string | undefined> {
  try {
    const filePath = getCatalogFilename(config);
    // const fileContentResponse = await octo.rest.repos.getContent({
    //   owner,
    //   repo,
    //   path: filePath,
    //   ref: prHeadSha,
    // });
    const fileContentResponse = await gitlab.RepositoryFiles.show(
      `${owner}/${repo}`,
      filePath,
      prHeadSha,
    );
    // if (!fileContentResponse.data) {
    //   return undefined;
    // }
    if (!('content' in fileContentResponse)) {
      return undefined;
    }
    return Buffer.from(fileContentResponse.content, 'base64').toString('utf-8');
  } catch (error: any) {
    logErrorIfNeeded(
      logger,
      `Error fetching catalog-info content from PR ${prNumber}`,
      error,
    );
    return undefined;
  }
}

export async function closePRWithComment(
  // octo: Octokit,
  gitlab: any,
  owner: string,
  repo: string,
  prNum: number,
  comment: string,
) {
  // await octo.rest.issues.createComment({
  //   owner,
  //   repo,
  //   issue_number: prNum,
  //   body: comment,
  // });
  await gitlab.MergeRequestNotes.create(`${owner}/${repo}`, prNum, comment);
  // await octo.rest.pulls.update({
  //   owner,
  //   repo,
  //   pull_number: prNum,
  //   state: 'closed',
  // });
  await gitlab.MergeRequests.edit(`${owner}/${repo}`, prNum, {
    stateEvent: 'close',
  });
}
