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

import type { GithubRepository } from '../types';

export function buildCommitsPullRequestsQuery(
  repository: GithubRepository,
  shas: string[],
): { query: string; variables: Record<string, string> } {
  // A commit usually has 1 associated PR; keep first: 10 for odd edge cases.
  const commitAssociatedPRsSection = `
  ... on Commit {
    associatedPullRequests(first: 10) {
      nodes {
        number
        commits(first: 1) {
          nodes {
            commit {
              committedDate
            }
          }
        }
      }
    }
  }
`;

  const variableDefinitions = shas
    .map((_, index) => `$sha${index}: String!`)
    .join(', ');
  const aliasedObjects = shas
    .map(
      (_, index) => `
            commit${index}: object(expression: $sha${index}) {
              ${commitAssociatedPRsSection}
            }
          `,
    )
    .join('\n');

  const query = `
        query getCommitsPullRequests($owner: String!, $repo: String!, ${variableDefinitions}) {
          repository(owner: $owner, name: $repo) {
            ${aliasedObjects}
          }
        }
      `;

  const variables: Record<string, string> = {
    owner: repository.owner,
    repo: repository.repo,
  };
  shas.forEach((sha, index) => {
    variables[`sha${index}`] = sha;
  });

  return { query, variables };
}
