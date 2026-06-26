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

import { ComponentType, createElement } from 'react';
import {
  coreExtensionData,
  createExtensionBlueprint,
  createExtensionDataRef,
  ExtensionBoundary,
} from '@backstage/frontend-plugin-api';

/** @alpha */
export interface ScorecardLayoutProps {
  groups: Record<
    string,
    { title: string; description?: string; metrics: string[] }
  >;
}

/**
 * Extension data ref carrying the human-readable layout title
 * (e.g. "Grid", "List") so the entity tab can build a toggle.
 *
 * @alpha
 */
export const scorecardLayoutTitleDataRef =
  createExtensionDataRef<string>().with({ id: 'scorecard.layout-title' });

/**
 * Blueprint for creating scorecard layout extensions.
 *
 * Each layout is a separate extension that attaches to the Scorecard entity tab.
 * Platform engineers enable/disable individual layouts via app-config.yaml;
 * when multiple layouts are enabled the tab renders a toggle to switch between them.
 *
 * @alpha
 */
export const ScorecardEntityContentLayoutBlueprint = createExtensionBlueprint({
  kind: 'scorecard-layout',
  attachTo: {
    id: 'entity-content:catalog/entity-content-scorecard',
    input: 'layouts',
  },
  output: [coreExtensionData.reactElement, scorecardLayoutTitleDataRef],
  dataRefs: {
    title: scorecardLayoutTitleDataRef,
  },
  config: {
    schema: {
      groups: schema =>
        schema
          .record(
            schema.object({
              title: schema.string(),
              description: schema.string().optional(),
              metrics: schema.array(schema.string()),
            }),
          )
          .optional()
          .default({}),
    },
  },
  *factory(
    params: {
      title: string;
      loader: () => Promise<ComponentType<ScorecardLayoutProps>>;
    },
    { config, node },
  ) {
    yield scorecardLayoutTitleDataRef(params.title);
    yield coreExtensionData.reactElement(
      ExtensionBoundary.lazy(node, async () => {
        const Component = await params.loader();
        return createElement(Component, {
          groups: config.groups,
        });
      }),
    );
  },
});
