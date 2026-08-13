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

import { buildCommitsPullRequestsQuery } from './buildCommitsPullRequestsQuery';

describe('buildCommitsPullRequestsQuery', () => {
  const repository = { owner: 'org', repo: 'test' };

  it('builds query variables for a single commit sha', () => {
    const sha = 'abc123';
    const { query, variables } = buildCommitsPullRequestsQuery(repository, [
      sha,
    ]);

    expect(variables).toEqual({
      owner: 'org',
      repo: 'test',
      sha0: sha,
    });
    expect(query).toContain(
      'query getCommitsPullRequests($owner: String!, $repo: String!, $sha0: String!)',
    );
    expect(query).toContain('repository(owner: $owner, name: $repo)');
    expect(query).toContain('commit0: object(expression: $sha0)');
    expect(query).toContain('associatedPullRequests(first: 10)');
    expect(query).toContain('committedDate');
  });

  it('builds aliased commit lookups for multiple shas', () => {
    const shaOne = 'sha-one';
    const shaTwo = 'sha-two';
    const { query, variables } = buildCommitsPullRequestsQuery(repository, [
      shaOne,
      shaTwo,
    ]);

    expect(variables).toEqual({
      owner: 'org',
      repo: 'test',
      sha0: shaOne,
      sha1: shaTwo,
    });
    expect(query).toContain(
      'query getCommitsPullRequests($owner: String!, $repo: String!, $sha0: String!, $sha1: String!)',
    );
    expect(query).toContain('commit0: object(expression: $sha0)');
    expect(query).toContain('commit1: object(expression: $sha1)');
  });
});
