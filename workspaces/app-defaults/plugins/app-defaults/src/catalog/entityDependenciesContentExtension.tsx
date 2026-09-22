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
  coreExtensionData,
  createExtensionInput,
  ExtensionBoundary,
} from '@backstage/frontend-plugin-api';
import { isKind } from '@backstage/plugin-catalog';
import {
  EntityCardBlueprint,
  EntityContentBlueprint,
  EntityContentLayoutBlueprint,
  type EntityContentLayoutProps,
} from '@backstage/plugin-catalog-react/alpha';
import { useEntity } from '@backstage/plugin-catalog-react';

import { buildEntityFilterFn } from './buildEntityFilterFn';
import { EntityDependenciesLayout } from './entityDependenciesLayout';

/**
 * Dependencies tab composed from NFS {@link EntityCardBlueprint} extensions.
 *
 * @internal
 */
export const entityDependenciesContentExtension =
  EntityContentBlueprint.makeWithOverrides({
    name: 'rhdh-component-dependencies',
    inputs: {
      layouts: createExtensionInput([
        EntityContentLayoutBlueprint.dataRefs.filterFunction.optional(),
        EntityContentLayoutBlueprint.dataRefs.filterExpression.optional(),
        EntityContentLayoutBlueprint.dataRefs.component,
      ]),
      cards: createExtensionInput([
        coreExtensionData.reactElement,
        EntityContentBlueprint.dataRefs.filterFunction.optional(),
        EntityContentBlueprint.dataRefs.filterExpression.optional(),
        EntityCardBlueprint.dataRefs.type.optional(),
      ]),
    },
    factory(originalFactory, { node, inputs }) {
      return originalFactory({
        path: '/dependencies',
        title: 'Dependencies',
        filter: isKind('component'),
        loader: async () => {
          const DefaultLayoutComponent = (props: EntityContentLayoutProps) => (
            <ExtensionBoundary node={node}>
              <EntityDependenciesLayout {...props} />
            </ExtensionBoundary>
          );

          const layouts = [
            ...inputs.layouts.map(layout => ({
              filter: buildEntityFilterFn(
                layout.get(
                  EntityContentLayoutBlueprint.dataRefs.filterFunction,
                ),
                layout.get(
                  EntityContentLayoutBlueprint.dataRefs.filterExpression,
                ),
              ),
              Component: layout.get(
                EntityContentLayoutBlueprint.dataRefs.component,
              ),
            })),
            {
              filter: buildEntityFilterFn(),
              Component: DefaultLayoutComponent,
            },
          ];

          const cards = inputs.cards.map(card => ({
            element: card.get(coreExtensionData.reactElement),
            type: card.get(EntityCardBlueprint.dataRefs.type),
            filter: buildEntityFilterFn(
              card.get(EntityContentBlueprint.dataRefs.filterFunction),
              card.get(EntityContentBlueprint.dataRefs.filterExpression),
            ),
          }));

          const Component = () => {
            const { entity } = useEntity();
            const layout = layouts.find(l => l.filter(entity));
            if (!layout) {
              throw new Error('No layout found for entity');
            }
            return (
              <layout.Component
                cards={cards.filter(card => card.filter(entity))}
              />
            );
          };

          return <Component />;
        },
      });
    },
  });
