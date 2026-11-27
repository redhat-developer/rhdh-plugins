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

import type { RootConfigService } from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import type { Source } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import type { PullRequestProvidersRegistry } from '../providers/PullRequestProvidersRegistry';

type SourceIntegration = {
  type: string;
  title: string;
  config: {
    host: string;
    baseUrl?: string;
  };
};

export interface SourceResolverOptions {
  providersRegistry: PullRequestProvidersRegistry;
}

/**
 * Discovers SCM integrations that have a registered pull request provider.
 */
export class SourceResolver {
  private constructor(private readonly sources: Map<string, Source>) {}

  static fromConfig(
    config: RootConfigService,
    deps: SourceResolverOptions,
  ): SourceResolver {
    const integrations = ScmIntegrations.fromConfig(config);
    const scmAuthIntegrations = [
      ...integrations.github.list(),
      ...integrations.gitlab.list(),
      ...integrations.azure.list(),
      ...integrations.bitbucketCloud.list(),
      ...integrations.bitbucketServer.list(),
    ];

    const sources = new Map<string, Source>();
    for (const scmAuthIntegration of scmAuthIntegrations) {
      if (!deps.providersRegistry.getProvider(scmAuthIntegration.type)) {
        continue;
      }

      const source = this.toSource(scmAuthIntegration);
      if (sources.has(source.id)) {
        throw new Error(`Duplicate SCM source: '${source.id}'`);
      }
      sources.set(source.id, source);
    }

    return new SourceResolver(sources);
  }

  resolve(sourceId: string): Source | undefined {
    return this.sources.get(sourceId);
  }

  listSources(): Source[] {
    return [...this.sources.values()];
  }

  private static toSource(integration: SourceIntegration): Source {
    return {
      id: `${integration.type}:${integration.config.host}`,
      type: integration.type,
      host: integration.config.host,
      title: integration.title,
      baseUrl:
        integration.config.baseUrl ?? `https://${integration.config.host}`,
    };
  }
}
