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

import { ConflictError } from '@backstage/errors';
import { createMockPullRequestProvider } from '../../__fixtures__';
import { PullRequestProvidersRegistry } from './PullRequestProvidersRegistry';

describe('PullRequestProvidersRegistry', () => {
  describe('register', () => {
    it('registers a provider', () => {
      const newProvider = createMockPullRequestProvider('custom');
      const registry = new PullRequestProvidersRegistry();

      registry.register(newProvider);

      expect(registry.getProvider('custom')).toBe(newProvider);
    });

    it('throws on a duplicate SCM type', () => {
      const registry = new PullRequestProvidersRegistry();
      registry.register(createMockPullRequestProvider('github'));

      expect(() =>
        registry.register(createMockPullRequestProvider('github')),
      ).toThrow(ConflictError);
    });
  });

  describe('getProvider', () => {
    it('retrieves a registered provider by type', () => {
      const github = createMockPullRequestProvider('github');
      const registry = new PullRequestProvidersRegistry();
      registry.register(github);

      expect(registry.getProvider('github')).toBe(github);
    });

    it('returns undefined for an unknown type', () => {
      const registry = new PullRequestProvidersRegistry();
      registry.register(createMockPullRequestProvider('github'));

      expect(registry.getProvider('gitlab')).toBeUndefined();
    });
  });

  describe('listProviders', () => {
    it('lists every registered provider', () => {
      const github = createMockPullRequestProvider('github');
      const gitlab = createMockPullRequestProvider('gitlab');
      const registry = new PullRequestProvidersRegistry();

      registry.register(github);
      registry.register(gitlab);

      expect(registry.listProviders()).toEqual([github, gitlab]);
    });
  });
});
