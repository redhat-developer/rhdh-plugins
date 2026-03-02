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

import { ConfigReader } from '@backstage/config';
import { DefaultGithubCredentialsProvider } from '@backstage/integration';
import { DependabotClient } from './DependabotClient';

jest
  .spyOn(DefaultGithubCredentialsProvider.prototype, 'getCredentials')
  .mockResolvedValue({
    type: 'token',
    headers: { Authorization: 'Bearer dummy-token' },
    token: 'dummy-token',
  });

describe('DependabotClient', () => {
  const mockConfig = new ConfigReader({
    integrations: {
      github: [{ host: 'github.com', token: 'dummy-token' }],
    },
  });
  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  } as any;
  const repository = { owner: 'owner', repo: 'repo' };
  const url = 'https://github.com/owner/repo';

  let client: DependabotClient;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DependabotClient(mockConfig, mockLogger);
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    } as Response);
  });

  it('constructs with config and logger', () => {
    expect(client).toBeDefined();
    expect(mockLogger.child).toHaveBeenCalledWith({
      component: 'DependabotClient',
    });
  });

  describe('getCriticalAlerts', () => {
    it('fetches alerts with severity=critical and returns them', async () => {
      const alerts = [
        {
          number: 1,
          state: 'open',
          created_at: '2024-01-01',
          security_advisory: { severity: 'critical' },
        },
      ];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(alerts),
        text: () => Promise.resolve(''),
      } as Response);

      const result = await client.getCriticalAlerts(url, repository);

      expect(result).toEqual(alerts);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/repos/owner/repo/dependabot/alerts'),
        expect.any(Object),
      );
      expect(fetchMock.mock.calls[0][0]).toContain('severity=critical');
      expect(fetchMock.mock.calls[0][0]).toContain('state=open');
      expect(fetchMock.mock.calls[0][0]).toContain('per_page=100');
    });

    it('paginates using Link header until all alerts are fetched', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        number: i + 1,
        state: 'open',
        created_at: '2024-01-01',
        security_advisory: { severity: 'critical' },
      }));
      const page2 = [
        {
          number: 101,
          state: 'open',
          created_at: '2024-01-01',
          security_advisory: { severity: 'critical' },
        },
      ];
      const nextPageUrl =
        'https://api.github.com/repos/owner/repo/dependabot/alerts?state=open&severity=critical&per_page=100&after=cursor123';
      const linkHeader = `<${nextPageUrl}>; rel="next"`;

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ link: linkHeader }),
          json: () => Promise.resolve(page1),
          text: () => Promise.resolve(''),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers(),
          json: () => Promise.resolve(page2),
          text: () => Promise.resolve(''),
        } as Response);

      const result = await client.getCriticalAlerts(url, repository);

      expect(result).toHaveLength(101);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][0]).toContain('per_page=100');
      expect(fetchMock.mock.calls[1][0]).toBe(nextPageUrl);
    });
  });

  describe('getHighAlerts', () => {
    it('fetches alerts with severity=high', async () => {
      await client.getHighAlerts(url, repository);
      expect(fetchMock.mock.calls[0][0]).toContain('severity=high');
    });
  });

  describe('getMediumAlerts', () => {
    it('fetches alerts with severity=medium', async () => {
      await client.getMediumAlerts(url, repository);
      expect(fetchMock.mock.calls[0][0]).toContain('severity=medium');
    });
  });

  describe('getLowAlerts', () => {
    it('fetches alerts with severity=low and returns them', async () => {
      const alerts = [
        {
          number: 2,
          state: 'open',
          created_at: '2024-02-01',
          security_advisory: { severity: 'low' },
        },
      ];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(alerts),
        text: () => Promise.resolve(''),
      } as Response);

      const result = await client.getLowAlerts(url, repository);

      expect(result).toEqual(alerts);
      expect(fetchMock.mock.calls[0][0]).toContain('severity=low');
    });
  });

  it('throws when GitHub integration is missing for URL', async () => {
    const unknownUrl = 'https://unknown-host/owner/repo';
    await expect(
      client.getCriticalAlerts(unknownUrl, repository),
    ).rejects.toThrow(
      "Missing GitHub integration for 'https://unknown-host/owner/repo'",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when API response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: () => Promise.resolve('Forbidden'),
      headers: new Headers(),
      json: () => Promise.resolve({}),
    } as Response);

    await expect(client.getCriticalAlerts(url, repository)).rejects.toThrow(
      /GitHub API error/,
    );
  });
});
