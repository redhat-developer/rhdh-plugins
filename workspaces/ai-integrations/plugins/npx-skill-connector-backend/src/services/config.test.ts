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
import { readSourceConfigs, readSourceSchedule } from './config';

function read(source: Record<string, unknown>) {
  return readSourceConfigs(
    new ConfigReader({
      npxSkillConnector: {
        sources: [
          source as NonNullable<ConstructorParameters<typeof ConfigReader>[0]>,
        ],
      },
    }),
  );
}

const valid = {
  id: 'rhess',
  indexUrl: 'https://skills.example.com/index.json',
};

describe('npx source configuration', () => {
  it('allows no configured sources', () => {
    expect(readSourceConfigs(new ConfigReader({}))).toEqual([]);
  });

  it.each([
    [{ indexUrl: valid.indexUrl }, 'id is required'],
    [{ ...valid, id: '.' }, "must not be '.' or '..'"],
    [{ ...valid, id: '..' }, "must not be '.' or '..'"],
    [{ ...valid, id: 'a/b' }, "must not contain '/'"],
    [{ id: valid.id }, 'indexUrl is required'],
  ])('rejects invalid source configuration', (source, message) => {
    expect(() => read(source)).toThrow(message);
  });

  it('rejects duplicate source IDs', () => {
    expect(() =>
      readSourceConfigs(
        new ConfigReader({
          npxSkillConnector: { sources: [valid, valid] },
        }),
      ),
    ).toThrow('Duplicate source ID');
  });

  it.each([
    'http://skills.example.com/index.json',
    'https://user:secret@skills.example.com/index.json',
    'https://skills.example.com/index.json#fragment',
    'not a URL',
  ])('rejects invalid index URL: %s', indexUrl => {
    expect(() => read({ ...valid, indexUrl })).toThrow('indexUrl');
  });

  it.each([
    'http://cdn.example.com',
    'https://user:secret@cdn.example.com',
    'https://cdn.example.com/path',
    'https://cdn.example.com?q=1',
    'not a URL',
  ])('rejects invalid allowed origin: %s', origin => {
    expect(() => read({ ...valid, allowedOrigins: [origin] })).toThrow(
      'allowedOrigins',
    );
  });

  it('reads a valid source and normalizes its allowed origin', () => {
    expect(
      read({
        ...valid,
        allowedOrigins: ['https://CDN.example.com:443/'],
      }),
    ).toEqual([
      {
        ...valid,
        allowedOrigins: ['https://cdn.example.com'],
        schedule: readSourceSchedule(),
      },
    ]);
  });

  it('uses a local ten-minute schedule by default', () => {
    expect(readSourceSchedule()).toEqual({
      frequency: { minutes: 10 },
      timeout: { minutes: 10 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    });
  });

  it('accepts a standard Backstage schedule', () => {
    expect(
      read({
        ...valid,
        schedule: {
          frequency: { minutes: 2 },
          timeout: { minutes: 1 },
        },
      })[0].schedule,
    ).toEqual({
      frequency: { minutes: 2 },
      timeout: { minutes: 1 },
      initialDelay: { seconds: 0 },
      scope: 'local',
    });
  });

  it('rejects a global schedule for local snapshots', () => {
    expect(() =>
      read({
        ...valid,
        schedule: {
          frequency: { minutes: 2 },
          timeout: { minutes: 1 },
          scope: 'global',
        },
      }),
    ).toThrow('local');
  });
});
