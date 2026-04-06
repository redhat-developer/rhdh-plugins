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

import { Entity } from '@backstage/catalog-model';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { rootRouteRef } from '../../routes';

/**
 * Extension for the Scorecard tab on Entity pages.
 * @alpha
 */
export const scorecardEntityContent = EntityContentBlueprint.makeWithOverrides({
  name: 'entity-content-scorecard',
  config: {
    schema: {
      // Allows flexible filtering: { kind: 'Component', type: 'service' }
      // or just { type: 'service' } for all services.
      allowedFilters: schema =>
        schema
          .array(
            schema.object({
              kind: schema.string().optional(),
              type: schema.string().optional(),
            }),
          )
          .optional(),
    },
  },
  factory(original, { config }) {
    return original({
      path: '/scorecard',
      title: 'Scorecard',
      routeRef: rootRouteRef,
      filter: (entity: Entity): boolean => {
        const filters = config.allowedFilters;

        if (!filters || filters.length === 0) return true;

        return filters.some(f => {
          const kindMatch =
            !f.kind || f.kind.toLowerCase() === entity.kind.toLowerCase();
          const typeMatch =
            !f.type ||
            f.type.toLowerCase() ===
              (entity.spec?.type as string)?.toLowerCase();

          return kindMatch && typeMatch;
        });
      },
      loader: async () => {
        const { EntityScorecardContent } = await import(
          '../../components/Scorecard'
        );
        return <EntityScorecardContent />;
      },
    });
  },
});
