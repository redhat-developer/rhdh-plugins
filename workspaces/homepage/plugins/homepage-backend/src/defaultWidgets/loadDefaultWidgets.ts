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

import { RootConfigService } from '@backstage/backend-plugin-api';
import { z } from 'zod/v3';
import { DefaultWidgetNode } from './types';

const userRefSchema = z
  .string()
  .min(1)
  .refine(s => s.startsWith('user:') && s.includes('/'), {
    message: 'Must be a fully qualified user ref (user:namespace/name)',
  });

const groupRefSchema = z
  .string()
  .min(1)
  .refine(s => s.startsWith('group:') && s.includes('/'), {
    message: 'Must be a fully qualified group ref (group:namespace/name)',
  });

const visibilitySchema = z
  .object({
    users: z.array(userRefSchema).optional(),
    groups: z.array(groupRefSchema).optional(),
    permissions: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const defaultWidgetNodeSchema: z.ZodType<DefaultWidgetNode> = z.lazy(
  () =>
    z
      .object({
        id: z.string().min(1).optional(),
        ref: z.string().min(1).optional(),
        props: z.record(z.string(), z.unknown()).optional(),
        layout: z.record(z.string(), z.unknown()).optional(),
        if: visibilitySchema.optional(),
        children: z.array(defaultWidgetNodeSchema).optional(),
      })
      .strict()
      .refine(
        n => {
          const hasId = n.id !== undefined && n.id.length > 0;
          const hasRef = n.ref !== undefined && n.ref.length > 0;
          const hasChildren = n.children !== undefined && n.children.length > 0;
          if (hasChildren) return !hasId && !hasRef;
          return hasId && hasRef;
        },
        {
          message:
            'Node must have `id` and `ref` (leaf) or non-empty `children` (group), not both',
        },
      ),
);

export const defaultWidgetsSchema = z.array(defaultWidgetNodeSchema);

/**
 * Reads and validates the `homepage.defaultWidgets` config.
 * Throws on invalid config so misconfiguration fails fast at backend startup.
 */
export function loadDefaultWidgets(
  config: RootConfigService,
): DefaultWidgetNode[] | undefined {
  const raw = config.getOptional('homepage.defaultWidgets');
  if (raw === undefined) return undefined;
  const parsed = defaultWidgetsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid homepage.defaultWidgets config: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

/** Walks the tree and returns the set of unique permission names referenced. */
export function collectReferencedPermissions(
  nodes: DefaultWidgetNode[],
): Set<string> {
  const out = new Set<string>();
  const walk = (n: DefaultWidgetNode) => {
    n.if?.permissions?.forEach(p => out.add(p));
    n.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}
