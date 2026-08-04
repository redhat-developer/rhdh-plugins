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
  GithubCommitsPullRequestsQueryResponse,
  GithubPullRequest,
} from './types';

export function mapCommitsPullRequests(
  repository: NonNullable<GithubCommitsPullRequestsQueryResponse['repository']>,
  shas: string[],
): Map<string, GithubPullRequest[]> {
  const pullRequestsBySha = new Map<string, GithubPullRequest[]>();

  shas.forEach((sha, index) => {
    const nodes =
      repository[`commit${index}`]?.associatedPullRequests?.nodes ?? [];
    pullRequestsBySha.set(
      sha,
      nodes.flatMap(pr =>
        pr
          ? [
              {
                number: pr.number,
                firstCommitAt:
                  pr.commits?.nodes?.[0]?.commit?.committedDate ?? null,
              },
            ]
          : [],
      ),
    );
  });

  return pullRequestsBySha;
}
