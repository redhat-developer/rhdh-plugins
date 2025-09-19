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

import { rest } from 'msw';

const localHostAndPort = 'localhost:8765';
export const LOCAL_ADDR = `http://${localHostAndPort}`;

export const LOCAL_GITLAB_ADDR = `https://gitlab.com/api/v4`;

export function loadTestFixture(filePathFromFixturesDir: string) {
  return require(`${__dirname}/${filePathFromFixturesDir}`);
}

function normalizeUrlsForTest(filePath: string) {
  return JSON.parse(
    JSON.stringify(loadTestFixture(filePath))
      .replaceAll('HOSTNAME', localHostAndPort)
      .replaceAll('api.github.com', localHostAndPort)
      .replaceAll('github.com', localHostAndPort)
      .replaceAll('gitlab.com', localHostAndPort)
      .replaceAll('https://', 'http://'),
  );
}

export const DEFAULT_TEST_HANDLERS = [
  rest.get(`${LOCAL_ADDR}/app/installations`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        normalizeUrlsForTest(
          'github/app/installations/app-installation-1.json',
        ),
      ]),
    );
  }),

  rest.post(
    `${LOCAL_ADDR}/app/installations/1/access_tokens`,
    (_, res, ctx) => {
      return res(
        ctx.status(201),
        ctx.json(
          normalizeUrlsForTest(
            'github/app/installations/app-installation-1-access-tokens.json',
          ),
        ),
      );
    },
  ),

  rest.get(`${LOCAL_ADDR}/installation/repositories`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(
        normalizeUrlsForTest('github/app/installations/repositories.json'),
      ),
    );
  }),

  rest.get(`${LOCAL_ADDR}/user/orgs`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/user/orgs.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/github`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/orgs/github.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/octocat`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/orgs/octocat.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/my-org-1`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/orgs/my-org-1.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/my-org-2`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/orgs/my-org-2.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/user`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/user/user.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/user/repos`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/user/repos.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/my-ent-org-1/repos`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/orgs/repos/my-ent-org-1.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/my-ent-org-2/repos`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('github/orgs/repos/my-ent-org-2.json')),
    );
  }),

  rest.get(`${LOCAL_ADDR}/orgs/my-ent-org--no-repos/repos`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(
        normalizeUrlsForTest('github/orgs/repos/my-ent-org--no-repos.json'),
      ),
    );
  }),

  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-no-import-pr`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'github/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-no-import-pr/repo.json',
          ),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'github/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/repo.json',
          ),
        ),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/contributors`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([loadTestFixture('user/user.json')]),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/pulls`,
    (_, res, ctx) => {
      return res(ctx.status(200), ctx.json([]));
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/contents/catalog-info.yaml`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'github/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/contents/catalog-info.yaml.json',
          ),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'github/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/repo.json',
          ),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/pulls`,
    (req, res, ctx) => {
      let prs: any;
      const stateQueryParam = req.url.searchParams?.get('state');
      if (stateQueryParam) {
        prs = loadTestFixture(
          `github/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/pulls/${stateQueryParam}.json`,
        );
      }
      return res(ctx.status(200), ctx.json(prs));
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/contents/catalog-info.yaml`,
    (_, res, ctx) => {
      return res(ctx.status(404));
    },
  ),

  rest.get(`${LOCAL_ADDR}/repos/my-ent-org-2/A2`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(loadTestFixture('github/repos/my-ent-org-2/A2/repo.json')),
    );
  }),
  rest.get(`${LOCAL_ADDR}/repos/octocat/my-awesome-repo`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(
        loadTestFixture('github/repos/octocat/my-awesome-repo/repo.json'),
      ),
    );
  }),
  rest.get(
    `${LOCAL_ADDR}/repos/octocat/my-awesome-repo/pulls`,
    (_, res, ctx) => {
      return res(ctx.status(200), ctx.json([]));
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/repos/octocat/my-awesome-repo/contents/catalog-info.yaml`,
    (_, res, ctx) => {
      return res(ctx.status(404));
    },
  ),
  // Gitlab related apis
  rest.get(`${LOCAL_ADDR}/api/v4/projects`, (_, res, ctx) => {
    const projectListHeaders = {
      'x-next-page': '',
      'x-page': '1',
      'x-per-page': '20',
      'x-prev-page': '',
      'x-total': '3',
      'x-total-pages': '1',
    };
    return res(
      ctx.status(200),
      ctx.set(projectListHeaders),
      ctx.json(normalizeUrlsForTest('gitlab/user/repos.json')),
    );
  }),

  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/saltypig1%2Ffuntimes`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(loadTestFixture('gitlab/repos/saltypig1/funtimes/repo.json')),
      );
    },
  ),
  rest.get(`${LOCAL_ADDR}/api/v4/user`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(normalizeUrlsForTest('gitlab/user/user.json')),
    );
  }),
  rest.get(`${LOCAL_ADDR}/api/v4/groups`, (req, res, ctx) => {
    const url = new URL(req.url);
    const searchParam = url.searchParams?.get('search');
    const orgList = normalizeUrlsForTest('gitlab/user/orgs.json');
    const orgListHeaders = {
      'x-next-page': '',
      'x-page': '1',
      'x-per-page': '20',
      'x-prev-page': '',
      'x-total': '3',
      'x-total-pages': '1',
    };

    if (searchParam) {
      orgListHeaders['x-total'] = '1';
      return res(
        ctx.status(200),
        ctx.set(orgListHeaders),
        ctx.json(
          orgList.filter((org: { name: string }) => org.name === searchParam),
        ),
      );
    }
    return res(
      ctx.status(200),
      // Set the pagination headers
      ctx.set(orgListHeaders),
      ctx.json(orgList),
    );
  }),

  rest.get(
    `${LOCAL_ADDR}/api/v4/groups/my-ent-org-1/projects`,
    (_, res, ctx) => {
      const repoListHeaders = {
        'x-next-page': '',
        'x-page': '1',
        'x-per-page': '20',
        'x-prev-page': '',
        'x-total': '1',
        'x-total-pages': '1',
      };
      return res(
        ctx.status(200),
        // Set the pagination headers
        ctx.set(repoListHeaders),
        ctx.json(normalizeUrlsForTest('gitlab/orgs/repos/my-ent-org-1.json')),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/groups/my-ent-org-2/projects`,
    (_, res, ctx) => {
      const repoListHeaders = {
        'x-next-page': '',
        'x-page': '1',
        'x-per-page': '20',
        'x-prev-page': '',
        'x-total': '2',
        'x-total-pages': '1',
      };
      return res(
        ctx.status(200),
        ctx.set(repoListHeaders),
        ctx.json(normalizeUrlsForTest('gitlab/orgs/repos/my-ent-org-2.json')),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/groups/my-ent-org--no-repos/projects`,
    (_, res, ctx) => {
      const repoListHeaders = {
        'x-next-page': '',
        'x-page': '1',
        'x-per-page': '20',
        'x-prev-page': '',
        'x-total': '0',
        'x-total-pages': '1',
      };
      return res(
        ctx.status(200),
        ctx.set(repoListHeaders),
        ctx.json(
          normalizeUrlsForTest('gitlab/orgs/repos/my-ent-org--no-repos.json'),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/saltypig1%2Ffuntimes/merge_requests`,
    (_, res, ctx) => {
      return res(ctx.status(200), ctx.json([]));
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-ent-org-2%2Fswapi-node`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture('gitlab/repos/my-ent-org-2/swapi-node/repo.json'),
        ),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/saltypig1%2Ffuntimes/repository/files/catalog-info.yaml`,
    (_, res, ctx) => {
      return res(ctx.status(404));
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-existing-catalog-info-in-default-branch`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'gitlab/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/repo.json',
          ),
        ),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/contributors`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([loadTestFixture('user/user.json')]),
      );
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-existing-catalog-info-in-default-branch/merge_requests`,
    (_, res, ctx) => {
      return res(ctx.status(200), ctx.json([]));
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-existing-catalog-info-in-default-branch/repository/files/catalog-info.yaml`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'gitlab/repos/my-org-1/my-repo-with-existing-catalog-info-in-default-branch/contents/catalog-info.yaml.json',
          ),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-no-catalog-info-in-default-branch-and-no-import-pr`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'gitlab/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-no-import-pr/repo.json',
          ),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-no-catalog-info-in-default-branch-and-import-pr`,
    (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          loadTestFixture(
            'gitlab/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/repo.json',
          ),
        ),
      );
    },
  ),

  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-no-catalog-info-in-default-branch-and-import-pr/merge_requests`,
    (req, res, ctx) => {
      let prs: any;
      const stateQueryParam = req.url.searchParams?.get('state');
      if (stateQueryParam) {
        prs = loadTestFixture(
          `gitlab/repos/my-org-1/my-repo-with-no-catalog-info-in-default-branch-and-import-pr/pulls/${stateQueryParam}.json`,
        );
      }
      return res(ctx.status(200), ctx.json(prs));
    },
  ),
  rest.get(
    `${LOCAL_ADDR}/api/v4/projects/my-org-1%2Fmy-repo-with-no-catalog-info-in-default-branch-and-import-pr/repository/files/catalog-info.yaml`,
    (_, res, ctx) => {
      return res(ctx.status(404));
    },
  ),
];
