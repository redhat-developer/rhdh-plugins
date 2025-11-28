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
  getCommitSha,
  createCommitObjectFromPLR,
  getCommitsFromPLRs,
  getLatestCommitFromPipelineRuns,
  getCommitDisplayName,
  getCommitShortName,
  showPLRType,
  showPLRMessage,
  createRepoUrl,
  createRepoBranchURL,
  createRepoPullRequestURL,
} from '../commits';
import {
  PipelineRunResource,
  PipelineRunLabel,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import {
  Commit,
  PipelineRunType,
  PipelineRunEventType,
} from '../pipeline-runs';
import * as pipelineRunsUtils from '../pipeline-runs';
import * as konfluxCommon from '@red-hat-developer-hub/backstage-plugin-konflux-common';

jest.mock('../pipeline-runs', () => ({
  ...jest.requireActual('../pipeline-runs'),
  getSourceUrl: jest.fn(),
}));

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  getApplicationFromResource: jest.fn(),
}));

const mockGetSourceUrl = pipelineRunsUtils.getSourceUrl as jest.MockedFunction<
  typeof pipelineRunsUtils.getSourceUrl
>;
const mockGetApplicationFromResource =
  konfluxCommon.getApplicationFromResource as jest.MockedFunction<
    typeof konfluxCommon.getApplicationFromResource
  >;

describe('commits', () => {
  const createMockPipelineRun = (
    overrides?: Partial<PipelineRunResource>,
  ): PipelineRunResource => ({
    kind: 'PipelineRun',
    apiVersion: 'v1',
    apiGroup: 'tekton.dev',
    metadata: {
      name: 'test-plr',
      namespace: 'default',
      creationTimestamp: '2024-01-01T00:00:00Z',
      labels: {},
      annotations: {},
    },
    subcomponent: { name: 'sub1' },
    cluster: { name: 'cluster1' },
    ...overrides,
  });

  const createMockCommit = (overrides?: Partial<Commit>): Commit => ({
    kind: 'PipelineRun',
    apiVersion: 'v1',
    apiGroup: 'tekton.dev',
    metadata: {
      name: 'abc123-test-app',
      uid: 'abc123-test-app',
      namespace: 'default',
    },
    cluster: { name: 'cluster1' },
    subcomponent: { name: 'sub1' },
    sha: 'abc1234567890',
    shaURL: 'https://github.com/org/repo/commit/abc1234567890',
    components: ['component1'],
    branch: 'main',
    pipelineRuns: [],
    isPullRequest: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSourceUrl.mockReturnValue('https://github.com/org/repo');
    mockGetApplicationFromResource.mockReturnValue('test-app');
  });

  describe('getCommitSha', () => {
    it('should return commit SHA from COMMIT_LABEL', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
        },
      });
      expect(getCommitSha(plr)).toBe('abc123');
    });

    it('should return commit SHA from TEST_SERVICE_COMMIT label', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.TEST_SERVICE_COMMIT]: 'def456',
          },
        },
      });
      expect(getCommitSha(plr)).toBe('def456');
    });

    it('should return commit SHA from COMMIT_ANNOTATION', () => {
      const plr = createMockPipelineRun({
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_ANNOTATION]: 'ghi789',
          },
        },
      });
      expect(getCommitSha(plr)).toBe('ghi789');
    });

    it('should return commit SHA from TEST_SERVICE_COMMIT annotation', () => {
      const plr = createMockPipelineRun({
        metadata: {
          annotations: {
            [PipelineRunLabel.TEST_SERVICE_COMMIT]: 'jkl012',
          },
        },
      });
      expect(getCommitSha(plr)).toBe('jkl012');
    });

    it('should prioritize COMMIT_LABEL over other sources', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
            [PipelineRunLabel.TEST_SERVICE_COMMIT]: 'def456',
          },
          annotations: {
            [PipelineRunLabel.COMMIT_ANNOTATION]: 'ghi789',
          },
        },
      });
      expect(getCommitSha(plr)).toBe('abc123');
    });

    it('should return undefined when no commit SHA is found', () => {
      const plr = createMockPipelineRun();
      expect(getCommitSha(plr)).toBeUndefined();
    });
  });

  describe('createCommitObjectFromPLR', () => {
    it('should return null when plr is null', () => {
      expect(createCommitObjectFromPLR(null)).toBeNull();
    });

    it('should return null when plr has no commit SHA', () => {
      const plr = createMockPipelineRun();
      expect(createCommitObjectFromPLR(plr)).toBeNull();
    });

    it('should create commit object with all fields', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc1234567890',
            [PipelineRunLabel.COMPONENT]: 'component1',
            [PipelineRunLabel.COMMIT_REPO_URL_LABEL]: 'test-repo',
            [PipelineRunLabel.COMMIT_REPO_ORG_LABEL]: 'test-org',
            [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]:
              PipelineRunEventType.PUSH,
            [PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL]: '123',
          },
          annotations: {
            [PipelineRunLabel.COMMIT_BRANCH_ANNOTATION]: 'main',
            [PipelineRunLabel.COMMIT_USER_LABEL]: 'test-user',
            [PipelineRunLabel.COMMIT_URL_ANNOTATION]:
              'https://github.com/org/repo/commit/abc123',
            [PipelineRunLabel.COMMIT_SHA_TITLE_ANNOTATION]: 'Test commit',
          },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        status: {
          startTime: '2024-01-01T00:00:00Z',
        },
      });

      const commit = createCommitObjectFromPLR(plr);

      expect(commit).not.toBeNull();
      expect(commit?.sha).toBe('abc1234567890');
      expect(commit?.shaURL).toBe('https://github.com/org/repo/commit/abc123');
      expect(commit?.shaTitle).toBe('Test commit');
      expect(commit?.branch).toBe('main');
      expect(commit?.user).toBe('test-user');
      expect(commit?.components).toEqual(['component1']);
      expect(commit?.repoName).toBe('test-repo');
      expect(commit?.repoOrg).toBe('test-org');
      expect(commit?.gitProvider).toBe('github');
      expect(commit?.pullRequestNumber).toBe('123');
      expect(commit?.isPullRequest).toBe(false);
      expect(commit?.application).toBe('test-app');
      expect(commit?.metadata.name).toBe('abc1234567890-test-app');
      expect(commit?.metadata.uid).toBe('abc1234567890-test-app');
    });

    it('should use default values when optional fields are missing', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });

      const commit = createCommitObjectFromPLR(plr);

      expect(commit).not.toBeNull();
      expect(commit?.branch).toBe('');
      expect(commit?.shaURL).toBe('https://github.com/org/repo/commit/abc123');
      expect(commit?.shaTitle).toBe('manual build');
      expect(commit?.components).toEqual(['']);
      expect(commit?.pullRequestNumber).toBe('');
    });

    it('should set isPullRequest to true when event type is PULL', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]:
              PipelineRunEventType.PULL,
          },
        },
      });

      const commit = createCommitObjectFromPLR(plr);

      expect(commit?.isPullRequest).toBe(true);
    });

    it('should use repoURL from getSourceUrl when COMMIT_URL_ANNOTATION is missing', () => {
      mockGetSourceUrl.mockReturnValue('https://github.com/org/repo');
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
        },
      });

      const commit = createCommitObjectFromPLR(plr);

      expect(commit?.shaURL).toBe('https://github.com/org/repo/commit/abc123');
    });
  });

  describe('getCommitsFromPLRs', () => {
    it('should return empty array when plrList is empty', () => {
      expect(getCommitsFromPLRs([])).toEqual([]);
    });

    it('should create commits from PLRs', () => {
      const plr1 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        status: {
          startTime: '2024-01-01T00:00:00Z',
        },
      });
      const plr2 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'def456',
          },
          creationTimestamp: '2024-01-02T00:00:00Z',
        },
        status: {
          startTime: '2024-01-02T00:00:00Z',
        },
      });

      const commits = getCommitsFromPLRs([plr1, plr2]);

      expect(commits).toHaveLength(2);
      expect(commits[0].sha).toBe('def456');
      expect(commits[1].sha).toBe('abc123');
    });

    it('should merge PLRs with same commit SHA and application', () => {
      const plr1 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
            [PipelineRunLabel.COMPONENT]: 'component1',
          },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        status: {
          startTime: '2024-01-01T00:00:00Z',
        },
      });
      const plr2 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
            [PipelineRunLabel.COMPONENT]: 'component2',
          },
          creationTimestamp: '2024-01-02T00:00:00Z',
        },
        status: {
          startTime: '2024-01-02T00:00:00Z',
        },
      });

      const commits = getCommitsFromPLRs([plr1, plr2]);

      expect(commits).toHaveLength(1);
      expect(commits[0].pipelineRuns).toHaveLength(2);
      expect(commits[0].components).toContain('component1');
      expect(commits[0].components).toContain('component2');
    });

    it('should update creationTime to latest when merging', () => {
      const plr1 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      });
      const plr2 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
          creationTimestamp: '2024-01-02T00:00:00Z',
        },
      });

      const commits = getCommitsFromPLRs([plr1, plr2]);

      expect(commits[0].creationTime).toBe('2024-01-02T00:00:00Z');
    });

    it('should sort pipelineRuns by startTime descending', () => {
      const plr1 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
        },
        status: {
          startTime: '2024-01-01T00:00:00Z',
        },
      });
      const plr2 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
        },
        status: {
          startTime: '2024-01-02T00:00:00Z',
        },
      });

      const commits = getCommitsFromPLRs([plr1, plr2]);

      expect(commits[0].pipelineRuns[0].status?.startTime).toBe(
        '2024-01-02T00:00:00Z',
      );
      expect(commits[0].pipelineRuns[1].status?.startTime).toBe(
        '2024-01-01T00:00:00Z',
      );
    });

    it('should limit results when limit is provided', () => {
      const plrs = Array.from({ length: 5 }, (_, i) =>
        createMockPipelineRun({
          metadata: {
            labels: {
              [PipelineRunLabel.COMMIT_LABEL]: `abc${i}`,
            },
            creationTimestamp: `2024-01-0${i + 1}T00:00:00Z`,
          },
        }),
      );

      const commits = getCommitsFromPLRs(plrs, 3);

      expect(commits).toHaveLength(3);
    });

    it('should skip PLRs without commit SHA', () => {
      const plr1 = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
        },
      });
      const plr2 = createMockPipelineRun();

      const commits = getCommitsFromPLRs([plr1, plr2]);

      expect(commits).toHaveLength(1);
      expect(commits[0].sha).toBe('abc123');
    });
  });

  describe('getLatestCommitFromPipelineRuns', () => {
    it('should return null when pipelineruns is undefined', () => {
      expect(getLatestCommitFromPipelineRuns()).toBeNull();
    });

    it('should return null when pipelineruns is empty', () => {
      expect(getLatestCommitFromPipelineRuns([])).toBeNull();
    });

    it('should return commit from first PLR', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.COMMIT_LABEL]: 'abc123',
          },
        },
      });

      const commit = getLatestCommitFromPipelineRuns([plr]);

      expect(commit).not.toBeNull();
      expect(commit?.sha).toBe('abc123');
    });
  });

  describe('getCommitDisplayName', () => {
    it('should return first 7 characters of SHA', () => {
      const commit = createMockCommit({ sha: 'abc1234567890' });
      expect(getCommitDisplayName(commit)).toBe('abc1234');
    });

    it('should handle SHA shorter than 7 characters', () => {
      const commit = createMockCommit({ sha: 'abc' });
      expect(getCommitDisplayName(commit)).toBe('abc');
    });
  });

  describe('getCommitShortName', () => {
    it('should return first 7 characters of commit name', () => {
      expect(getCommitShortName('abc1234567890')).toBe('abc1234');
    });

    it('should handle name shorter than 7 characters', () => {
      expect(getCommitShortName('abc')).toBe('abc');
    });
  });

  describe('showPLRType', () => {
    it('should return null when plr is null', () => {
      expect(showPLRType(null as any)).toBeNull();
    });

    it('should return null when PIPELINE_TYPE is missing', () => {
      const plr = createMockPipelineRun();
      expect(showPLRType(plr)).toBeNull();
    });

    it('should return "Build" for BUILD type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          },
        },
      });
      expect(showPLRType(plr)).toBe('Build');
    });

    it('should return "Integration test" for TEST type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
          },
        },
      });
      expect(showPLRType(plr)).toBe('Integration test');
    });

    it('should return "Release" for RELEASE type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.RELEASE,
          },
        },
      });
      expect(showPLRType(plr)).toBe('Release');
    });

    it('should return null for unknown type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: 'unknown',
          },
        },
      });
      expect(showPLRType(plr)).toBeNull();
    });
  });

  describe('showPLRMessage', () => {
    it('should return null when PIPELINE_TYPE is missing', () => {
      const plr = createMockPipelineRun();
      expect(showPLRMessage(plr)).toBeNull();
    });

    it('should return "Build deploying" for BUILD type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          },
        },
      });
      expect(showPLRMessage(plr)).toBe('Build deploying');
    });

    it('should return "Testing" for TEST type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
          },
        },
      });
      expect(showPLRMessage(plr)).toBe('Testing');
    });

    it('should return "Releasing" for RELEASE type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.RELEASE,
          },
        },
      });
      expect(showPLRMessage(plr)).toBe('Releasing');
    });

    it('should return null for unknown type', () => {
      const plr = createMockPipelineRun({
        metadata: {
          labels: {
            [PipelineRunLabel.PIPELINE_TYPE]: 'unknown',
          },
        },
      });
      expect(showPLRMessage(plr)).toBeNull();
    });
  });

  describe('createRepoUrl', () => {
    it('should return null when gitProvider is not github', () => {
      const commit = createMockCommit({ gitProvider: 'gitlab' });
      expect(createRepoUrl(commit)).toBeNull();
    });

    it('should return repoURL when gitProvider is github and repoURL exists', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        repoURL: 'https://github.com/org/repo',
      });
      expect(createRepoUrl(commit)).toBe('https://github.com/org/repo');
    });

    it('should construct URL from repoOrg and repoName when repoURL is missing', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        repoOrg: 'test-org',
        repoName: 'test-repo',
      });
      expect(createRepoUrl(commit)).toBe(
        'https://github.com/test-org/test-repo',
      );
    });

    it('should return null when repoOrg or repoName is missing', () => {
      const commit1 = createMockCommit({
        gitProvider: 'github',
        repoOrg: 'test-org',
      });
      expect(createRepoUrl(commit1)).toBeNull();

      const commit2 = createMockCommit({
        gitProvider: 'github',
        repoName: 'test-repo',
      });
      expect(createRepoUrl(commit2)).toBeNull();
    });
  });

  describe('createRepoBranchURL', () => {
    it('should return undefined when branch is missing', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        repoURL: 'https://github.com/org/repo',
        branch: '',
      });
      expect(createRepoBranchURL(commit)).toBeUndefined();
    });

    it('should return undefined when repoUrl is null', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        branch: 'main',
      });
      mockGetSourceUrl.mockReturnValue(undefined);
      expect(createRepoBranchURL(commit)).toBeUndefined();
    });

    it('should return branch URL when branch and repoUrl exist', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        repoURL: 'https://github.com/org/repo',
        branch: 'main',
      });
      expect(createRepoBranchURL(commit)).toBe(
        'https://github.com/org/repo/tree/main',
      );
    });
  });

  describe('createRepoPullRequestURL', () => {
    it('should return null when pullRequestNumber is missing', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        repoURL: 'https://github.com/org/repo',
      });
      expect(createRepoPullRequestURL(commit)).toBeNull();
    });

    it('should return null when repoURL is null', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        pullRequestNumber: '123',
      });
      expect(createRepoPullRequestURL(commit)).toBeNull();
    });

    it('should return PR URL when pullRequestNumber and repoURL exist', () => {
      const commit = createMockCommit({
        gitProvider: 'github',
        repoURL: 'https://github.com/org/repo',
        pullRequestNumber: '123',
      });
      expect(createRepoPullRequestURL(commit)).toBe(
        'https://github.com/org/repo/pull/123',
      );
    });
  });
});
