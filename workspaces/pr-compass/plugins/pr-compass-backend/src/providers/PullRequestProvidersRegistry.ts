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
import type { PullRequestProvider } from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';

export class PullRequestProvidersRegistry {
  private readonly providers = new Map<string, PullRequestProvider>();

  /** Registers a provider. Throws on a duplicate SCM type. */
  register(provider: PullRequestProvider): void {
    if (this.providers.has(provider.type)) {
      throw new ConflictError(
        `Pull request provider for SCM type '${provider.type}' has already been registered`,
      );
    }
    this.providers.set(provider.type, provider);
  }

  getProvider(type: string): PullRequestProvider | undefined {
    return this.providers.get(type);
  }

  listProviders(): PullRequestProvider[] {
    return [...this.providers.values()];
  }
}
