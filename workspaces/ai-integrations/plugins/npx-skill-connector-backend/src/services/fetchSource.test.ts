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

import { fetchSourceBuffer } from './fetchSource';

const source = { indexUrl: 'https://skills.example.com/index.json' };
const artifact = 'https://skills.example.com/skill.md';

describe('fetchSourceBuffer', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => jest.restoreAllMocks());

  it('reads a skill file from the configured origin', async () => {
    fetchMock.mockResolvedValue(new Response('skill'));
    await expect(
      fetchSourceBuffer(artifact, source, 'artifact'),
    ).resolves.toEqual(Buffer.from('skill'));
  });

  it('allows a separately configured artifact origin', async () => {
    fetchMock.mockResolvedValue(new Response('skill'));
    await expect(
      fetchSourceBuffer(
        'https://cdn.example.com/skill.md',
        { ...source, allowedOrigins: ['https://cdn.example.com'] },
        'artifact',
      ),
    ).resolves.toEqual(Buffer.from('skill'));
  });

  it.each([
    'http://skills.example.com/skill.md',
    'https://user:pass@skills.example.com/skill.md',
    'https://other.example.com/skill.md',
    'https://skills.example.com/skill.md#section',
  ])('rejects an invalid target before fetching: %s', async url => {
    await expect(fetchSourceBuffer(url, source, 'artifact')).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://other.example.com/skill.md',
    'http://skills.example.com/skill.md',
    'https://user:secret@skills.example.com/skill.md',
  ])('checks a redirect before following it: %s', async location => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location },
      }),
    );
    await expect(
      fetchSourceBuffer(artifact, source, 'artifact'),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('follows a redirect within the configured origin', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: '/other.md' },
        }),
      )
      .mockResolvedValueOnce(new Response('other skill'));
    await expect(
      fetchSourceBuffer(artifact, source, 'artifact'),
    ).resolves.toEqual(Buffer.from('other skill'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects an oversized skill file while reading it', async () => {
    fetchMock.mockResolvedValue(new Response(Buffer.alloc(1024 * 1024 + 1)));
    await expect(
      fetchSourceBuffer(artifact, source, 'artifact'),
    ).rejects.toThrow('maximum size');
  });

  it('honors caller cancellation', async () => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled'));
    await expect(
      fetchSourceBuffer(artifact, source, 'artifact', controller.signal),
    ).rejects.toThrow('cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
