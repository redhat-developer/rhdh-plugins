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
  Codespace,
  GitRepositoryRef,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { buildCodespace } from './buildCodespacesUrl';

describe('buildCodespace', () => {
  it('builds a Codespaces URL using the target repo and branch', () => {
    const codespace = buildCodespace(
      new GitRepositoryRef(
        'https://github.com/ecotoperRH/chef-examples.git',
        'devcontainers-test',
      ),
    );

    expect(codespace).toBeInstanceOf(Codespace);
    expect(codespace?.url).toBe(
      'https://codespaces.new/ecotoperRH/chef-examples?ref=devcontainers-test&devcontainer_path=.devcontainer%2Fansible%2Fdevcontainer.json',
    );
  });

  it('encodes branch names containing special characters', () => {
    expect(
      buildCodespace(
        new GitRepositoryRef(
          'https://github.com/org/repo',
          'feature/new-branch',
        ),
      )?.url,
    ).toBe(
      'https://codespaces.new/org/repo?ref=feature%2Fnew-branch&devcontainer_path=.devcontainer%2Fansible%2Fdevcontainer.json',
    );
  });

  it('returns undefined for non-GitHub repositories', () => {
    expect(
      buildCodespace(
        new GitRepositoryRef('https://gitlab.com/org/repo', 'main'),
      ),
    ).toBeUndefined();
  });

  it('returns undefined for invalid repository URLs', () => {
    expect(
      buildCodespace(new GitRepositoryRef('not-a-url', 'main')),
    ).toBeUndefined();
  });
});
