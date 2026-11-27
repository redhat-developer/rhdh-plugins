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
import { extractAuthHost } from './extractHost';

describe('extractAuthHost', () => {
  it.each([
    ['https://gitlab.example.com/o/r', 'gitlab.example.com'],
    ['gitlab.example.com/o/r', 'gitlab.example.com'],
    ['gitlab.example.com?owner=o&repo=r', 'gitlab.example.com'],
    ['https://gitlab.example.com:8443/o/r', 'gitlab.example.com:8443'],
    ['https://gitlab.example.com:443/o/r', 'gitlab.example.com'],
    ['HTTPS://GitLab.Example.com/o/r', 'gitlab.example.com'],
    ['  https://github.com/o/r  ', 'github.com'],
    ['https://github.com/o/r?ref=a@b#c@d', 'github.com'],
  ])('accepts %j as %j', (url, host) => {
    expect(extractAuthHost(url)).toBe(host);
  });

  it.each([
    'https://gitlab.example.com\\@evil.test/o/r',
    'https://user@gitlab.example.com/o/r',
    'https://user:pass@gitlab.example.com/o/r',
    'http://gitlab.example.com/o/r',
    'ssh://gitlab.example.com/o/r',
    'https://gitlab.example.com/o\t/r',
    'https://gitlab%2Eexample.com/o/r',
    'https://gitlab.example.com:/o/r',
    'https:////gitlab.example.com/o/r',
    'user@gitlab.example.com/o/r',
    'https://bücher.example/o/r',
    '',
    '   ',
  ])('refuses %j', url => {
    expect(extractAuthHost(url)).toBeUndefined();
  });
});
