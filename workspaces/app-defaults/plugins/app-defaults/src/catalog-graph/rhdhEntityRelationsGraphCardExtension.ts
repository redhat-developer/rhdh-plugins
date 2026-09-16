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

import type { Entity } from '@backstage/catalog-model';
import { jsx } from 'react/jsx-runtime';
import { z } from 'zod/v4';
import {
  EntityCardBlueprint,
  type EntityCardType,
} from '@backstage/plugin-catalog-react/alpha';
import { Direction } from '@backstage/plugin-catalog-graph';

const rhdhEntityRelationsGraphCardConfigSchema = {
  kinds: z.array(z.string()).optional(),
  relations: z.array(z.string()).optional(),
  maxDepth: z.number().optional(),
  unidirectional: z.boolean().optional(),
  mergeRelations: z.boolean().optional(),
  showArrowHeads: z.boolean().optional(),
  direction: z.nativeEnum(Direction).optional(),
  relationPairs: z.array(z.tuple([z.string(), z.string()])).optional(),
  zoom: z.enum(['enabled', 'disabled', 'enable-on-click']).optional(),
  curve: z.enum(['curveStepBefore', 'curveMonotoneX']).optional(),
  title: z.string().optional(),
  height: z.number().optional(),
};

/**
 * Shared RHDH relations graph entity-card blueprint (Overview vs Dependencies).
 *
 * @internal
 */
export function makeRhdhEntityRelationsGraphCardExtension(options: {
  name: string;
  attachTo: { id: string; input: 'cards' };
  filter: (entity: Entity) => boolean;
  type: EntityCardType;
  defaultDirection?: Direction;
}) {
  const { name, attachTo, filter, type, defaultDirection } = options;

  return EntityCardBlueprint.makeWithOverrides({
    name,
    attachTo,
    configSchema: rhdhEntityRelationsGraphCardConfigSchema,
    factory(originalFactory, { config }) {
      return originalFactory({
        filter,
        type,
        loader: async () =>
          import('@backstage/plugin-catalog-graph').then(m =>
            jsx(m.EntityCatalogGraphCard, {
              ...config,
              ...(defaultDirection !== undefined
                ? { direction: config.direction ?? defaultDirection }
                : {}),
              height: config.height ?? 400,
            }),
          ),
      });
    },
  });
}
