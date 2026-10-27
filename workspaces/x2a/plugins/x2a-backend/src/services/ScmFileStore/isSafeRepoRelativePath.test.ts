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

import { isSafeRepoRelativePath } from './isSafeRepoRelativePath';

describe('isSafeRepoRelativePath', () => {
  it.each([
    'migration-plan.md',
    'proj-ab12/migration-plan.md',
    'proj-ab12/modules/My Module/migration-plan-My_Module.md',
    'dir/.hidden/file.md',
    'a/b..c/d.md',
  ])('accepts %p', value => {
    expect(isSafeRepoRelativePath(value)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['absolute path', '/etc/passwd'],
    ['parent segment', '../secret.md'],
    ['embedded parent segment', 'a/../../secret.md'],
    ['trailing parent segment', 'a/..'],
    ['current dir segment', 'a/./b.md'],
    ['empty segment', 'a//b.md'],
    ['trailing slash', 'a/b/'],
    ['http URL', 'https://example.com/plan.md'],
    ['scheme without slashes', 'file:plan.md'],
    ['windows drive', 'C:/plan.md'],
    ['backslash', 'a\\b.md'],
    ['newline', 'a\nb.md'],
    ['NUL byte', 'a\u0000b.md'],
  ])('rejects %s', (_name, value) => {
    expect(isSafeRepoRelativePath(value)).toBe(false);
  });
});
