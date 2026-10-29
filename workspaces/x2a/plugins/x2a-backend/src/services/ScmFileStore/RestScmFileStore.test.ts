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
  AuthenticationError,
  ConflictError,
  InputError,
  NotAllowedError,
  NotFoundError,
  ServiceUnavailableError,
} from '@backstage/errors';
import type { ScmProviderName } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { RestScmFileStore } from './RestScmFileStore';

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const b64 = (s: string) => Buffer.from(s, 'utf-8').toString('base64');

const ghLoc = {
  repoUrl: 'https://github.com/own/repo.git',
  branch: 'main',
  path: 'proj/migration plan.md',
  token: 'tok',
};
const glLoc = {
  repoUrl: 'https://gitlab.com/grp/sub/repo.git',
  branch: 'release/1',
  path: 'proj/migration-plan.md',
  token: 'oauth2:tok',
};

describe('RestScmFileStore', () => {
  let fetchFn: jest.Mock;
  let store: RestScmFileStore;

  beforeEach(() => {
    fetchFn = jest.fn();
    store = new RestScmFileStore(undefined, fetchFn);
  });

  const lastCall = (n = 0) => {
    const [url, init] = fetchFn.mock.calls[n];
    return { url: url as string, init: init as RequestInit };
  };

  describe('GitHub', () => {
    describe('getFile', () => {
      it('reads the decoded content and the blob sha', async () => {
        fetchFn.mockResolvedValue(
          json(200, {
            type: 'file',
            encoding: 'base64',
            content: b64('# Plan\nčšž').replace(/(.{10})/g, '$1\n'),
            sha: 'blob1',
          }),
        );

        await expect(store.getFile(ghLoc)).resolves.toEqual({
          content: '# Plan\nčšž',
          version: 'blob1',
        });

        const { url, init } = lastCall();
        expect(url).toBe(
          'https://api.github.com/repos/own/repo/contents/proj/migration%20plan.md?ref=main',
        );
        expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
      });

      it('uses the /api/v3 base URL for GitHub Enterprise hosts', async () => {
        const map = new Map<string, ScmProviderName>([['ghe.corp', 'github']]);
        store = new RestScmFileStore(map, fetchFn);
        fetchFn.mockResolvedValue(
          json(200, {
            type: 'file',
            encoding: 'base64',
            content: '',
            sha: 's',
          }),
        );

        await store.getFile({ ...ghLoc, repoUrl: 'https://ghe.corp/o/r' });

        expect(lastCall().url).toMatch(
          /^https:\/\/ghe\.corp\/api\/v3\/repos\/o\/r\/contents\//,
        );
      });

      it('encodes the branch', async () => {
        fetchFn.mockResolvedValue(
          json(200, {
            type: 'file',
            encoding: 'base64',
            content: '',
            sha: 's',
          }),
        );
        await store.getFile({ ...ghLoc, branch: 'feat/a b' });
        expect(lastCall().url).toMatch(/\?ref=feat%2Fa%20b$/);
      });

      it.each([
        [401, AuthenticationError],
        [403, NotAllowedError],
        [404, NotFoundError],
        [500, ServiceUnavailableError],
        [503, ServiceUnavailableError],
        [418, ServiceUnavailableError],
      ])('maps status %s', async (status, errorClass) => {
        fetchFn.mockResolvedValue(json(status, { message: 'nope' }));
        await expect(store.getFile(ghLoc)).rejects.toBeInstanceOf(errorClass);
      });

      it('maps a network failure to ServiceUnavailableError', async () => {
        fetchFn.mockRejectedValue(new Error('ECONNREFUSED'));
        await expect(store.getFile(ghLoc)).rejects.toThrow(
          /Could not reach GitHub \(ECONNREFUSED\)/,
        );
      });

      it('rejects a directory', async () => {
        fetchFn.mockResolvedValue(json(200, [{ type: 'file' }]));
        await expect(store.getFile(ghLoc)).rejects.toBeInstanceOf(InputError);
      });

      it('reports files whose content GitHub does not return', async () => {
        fetchFn.mockResolvedValue(
          json(200, { type: 'file', encoding: 'none', content: '', sha: 's' }),
        );
        await expect(store.getFile(ghLoc)).rejects.toThrow(/too large/);
      });

      it('rejects a repository URL without owner and repo', async () => {
        await expect(
          store.getFile({ ...ghLoc, repoUrl: 'https://github.com/own' }),
        ).rejects.toBeInstanceOf(InputError);
        expect(fetchFn).not.toHaveBeenCalled();
      });
    });

    describe('putFile', () => {
      const put = {
        ...ghLoc,
        content: 'new ✓',
        message: 'Manual update',
        expectedVersion: 'blob1',
      };

      it('commits and returns the new blob sha', async () => {
        fetchFn.mockResolvedValue(json(200, { content: { sha: 'blob2' } }));

        await expect(store.putFile(put)).resolves.toEqual({ version: 'blob2' });

        const { url, init } = lastCall();
        expect(url).toBe(
          'https://api.github.com/repos/own/repo/contents/proj/migration%20plan.md',
        );
        expect(init.method).toBe('PUT');
        expect(JSON.parse(init.body as string)).toEqual({
          message: 'Manual update',
          content: b64('new ✓'),
          sha: 'blob1',
          branch: 'main',
        });
      });

      it('maps 409 to a stale version conflict', async () => {
        fetchFn.mockResolvedValue(json(409, { message: 'does not match' }));
        const error = await store.putFile(put).catch(e => e);
        expect(error).toBeInstanceOf(ConflictError);
        expect(error.message).toMatch(/Reload/);
      });

      it.each([
        'secret scanning push protection found a secret',
        'Push declined due to repository rule violations',
      ])('maps a blocked 409 (%s) to push denied', async message => {
        fetchFn.mockResolvedValue(json(409, { message }));
        const error = await store.putFile(put).catch(e => e);
        expect(error).toBeInstanceOf(NotAllowedError);
        expect(error.message).toContain(message);
      });

      it('maps a 422 about the sha to a stale version conflict', async () => {
        fetchFn.mockResolvedValue(
          json(422, { message: 'Invalid request. "sha" wasn\'t supplied.' }),
        );
        await expect(store.putFile(put)).rejects.toBeInstanceOf(ConflictError);
      });

      it('does not treat other 422 as a conflict', async () => {
        fetchFn.mockResolvedValue(json(422, { message: 'Validation Failed' }));
        await expect(store.putFile(put)).rejects.toBeInstanceOf(
          ServiceUnavailableError,
        );
      });

      it('maps a pull-request requirement to push denied', async () => {
        const message = 'Changes must be made through a pull request.';
        fetchFn.mockResolvedValue(json(422, { message }));
        const error = await store.putFile(put).catch(e => e);
        expect(error).toBeInstanceOf(NotAllowedError);
        expect(error.message).toContain(message);
      });

      it('maps 403 to a push denied error with next steps', async () => {
        fetchFn.mockResolvedValue(json(403, { message: 'protected' }));
        const error = await store.putFile(put).catch(e => e);
        expect(error).toBeInstanceOf(NotAllowedError);
        expect(error.message).toMatch(/not allowed to push to branch "main"/);
      });

      it.each([
        [401, AuthenticationError],
        [404, NotFoundError],
        [502, ServiceUnavailableError],
      ])('maps status %s', async (status, errorClass) => {
        fetchFn.mockResolvedValue(json(status, {}));
        await expect(store.putFile(put)).rejects.toBeInstanceOf(errorClass);
      });

      it('fails when the response carries no new version', async () => {
        fetchFn.mockResolvedValue(json(200, {}));
        await expect(store.putFile(put)).rejects.toBeInstanceOf(
          ServiceUnavailableError,
        );
      });

      it('maps a network failure', async () => {
        fetchFn.mockRejectedValue(new Error('timeout'));
        await expect(store.putFile(put)).rejects.toBeInstanceOf(
          ServiceUnavailableError,
        );
      });
    });
  });

  describe('GitLab', () => {
    describe('getFile', () => {
      it('reads the content and last commit id, stripping the token prefix', async () => {
        fetchFn.mockResolvedValue(
          json(200, {
            encoding: 'base64',
            content: b64('# Plan'),
            last_commit_id: 'c1',
          }),
        );

        await expect(store.getFile(glLoc)).resolves.toEqual({
          content: '# Plan',
          version: 'c1',
        });

        const { url, init } = lastCall();
        expect(url).toBe(
          'https://gitlab.com/api/v4/projects/grp%2Fsub%2Frepo/repository/files/proj%2Fmigration-plan.md?ref=release%2F1',
        );
        expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
      });

      it('accepts an unprefixed (configured) token', async () => {
        fetchFn.mockResolvedValue(
          json(200, { encoding: 'base64', content: '', last_commit_id: 'c' }),
        );
        await store.getFile({ ...glLoc, token: 'plain' });
        expect(lastCall().init.headers).toMatchObject({
          Authorization: 'Bearer plain',
        });
      });

      it('is used for unknown (self-hosted) hosts', async () => {
        fetchFn.mockResolvedValue(
          json(200, { encoding: 'base64', content: '', last_commit_id: 'c' }),
        );
        await store.getFile({ ...glLoc, repoUrl: 'https://git.corp:8443/a/b' });
        expect(lastCall().url).toMatch(
          /^https:\/\/git\.corp:8443\/api\/v4\/projects\/a%2Fb\//,
        );
      });

      it.each([
        [401, AuthenticationError],
        [403, NotAllowedError],
        [404, NotFoundError],
        [500, ServiceUnavailableError],
      ])('maps status %s', async (status, errorClass) => {
        fetchFn.mockResolvedValue(json(status, { message: 'x' }));
        await expect(store.getFile(glLoc)).rejects.toBeInstanceOf(errorClass);
      });

      it('rejects an unexpected payload', async () => {
        fetchFn.mockResolvedValue(json(200, { encoding: 'text' }));
        await expect(store.getFile(glLoc)).rejects.toBeInstanceOf(
          ServiceUnavailableError,
        );
      });
    });

    describe('putFile', () => {
      const put = {
        ...glLoc,
        content: 'new',
        message: 'Manual update',
        expectedVersion: 'c1',
      };
      const readBack = json(200, {
        encoding: 'base64',
        content: b64('new'),
        last_commit_id: 'c2',
      });

      it('commits and reads the new version back', async () => {
        fetchFn
          .mockResolvedValueOnce(json(200, { file_path: 'x', branch: 'b' }))
          .mockResolvedValueOnce(readBack);

        await expect(store.putFile(put)).resolves.toEqual({ version: 'c2' });

        const first = lastCall(0);
        expect(first.init.method).toBe('PUT');
        expect(JSON.parse(first.init.body as string)).toEqual({
          branch: 'release/1',
          content: 'new',
          commit_message: 'Manual update',
          last_commit_id: 'c1',
        });
        expect(lastCall(1).url).toMatch(/\?ref=release%2F1$/);
      });

      it('maps a stale last_commit_id (400) to a conflict', async () => {
        fetchFn.mockResolvedValue(
          json(400, {
            message:
              'You are attempting to update a file that has changed since you started editing it.',
          }),
        );
        await expect(store.putFile(put)).rejects.toBeInstanceOf(ConflictError);
      });

      it('maps 409 to a conflict', async () => {
        fetchFn.mockResolvedValue(json(409, {}));
        await expect(store.putFile(put)).rejects.toBeInstanceOf(ConflictError);
      });

      it('maps a protected branch (400) to push denied', async () => {
        fetchFn.mockResolvedValue(
          json(400, {
            message: 'You are not allowed to push into this branch',
          }),
        );
        await expect(store.putFile(put)).rejects.toBeInstanceOf(
          NotAllowedError,
        );
      });

      it('maps an unrelated 400 to an unexpected status error with detail', async () => {
        fetchFn.mockResolvedValue(json(400, { message: 'bad stuff' }));
        await expect(store.putFile(put)).rejects.toThrow(/bad stuff/);
      });

      it.each([
        [401, AuthenticationError],
        [403, NotAllowedError],
        [404, NotFoundError],
        [500, ServiceUnavailableError],
      ])('maps status %s', async (status, errorClass) => {
        fetchFn.mockResolvedValue(json(status, {}));
        await expect(store.putFile(put)).rejects.toBeInstanceOf(errorClass);
      });

      it('tells the user to reload when the commit succeeded but the read-back failed', async () => {
        fetchFn
          .mockResolvedValueOnce(json(200, {}))
          .mockResolvedValueOnce(json(500, {}));
        await expect(store.putFile(put)).rejects.toThrow(
          /committed to GitLab.*Reload/,
        );
      });
    });
  });

  describe('Bitbucket', () => {
    it('rejects reads with an InputError before any request', async () => {
      await expect(
        store.getFile({ ...ghLoc, repoUrl: 'https://bitbucket.org/ws/repo' }),
      ).rejects.toBeInstanceOf(InputError);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('rejects writes with an InputError before any request', async () => {
      await expect(
        store.putFile({
          ...ghLoc,
          repoUrl: 'https://bitbucket.org/ws/repo',
          content: 'c',
          message: 'm',
          expectedVersion: 'v',
        }),
      ).rejects.toThrow(/not supported for Bitbucket/);
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });
});
