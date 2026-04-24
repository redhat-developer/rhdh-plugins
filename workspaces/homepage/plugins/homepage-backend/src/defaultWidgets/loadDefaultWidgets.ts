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

const entityRefSchema = z
  .string()
  .min(1)
  .refine(s => s.includes(':') && s.includes('/'), {
    message: 'Must be a fully qualified entity ref (kind:namespace/name)',
  });

const visibilitySchema = z
  .object({
    users: z.array(entityRefSchema).optional(),
    groups: z.array(entityRefSchema).optional(),
    permissions: z.array(z.string().min(1)).optional(),
  })
  .strict();

const cardLayoutSchema = z
  .object({
    x: z.number().optional(),
    y: z.number().optional(),
    w: z.number().optional(),
    h: z.number().optional(),
  })
  .strict();

export const defaultWidgetNodeSchema: z.ZodType<DefaultWidgetNode> = z.lazy(
  () =>
    z
      .object({
        id: z.string().min(1).optional(),
        ref: z.string().min(1).optional(),
        props: z.record(z.string(), z.unknown()).optional(),
        layouts: z.record(z.string(), cardLayoutSchema).optional(),
        if: visibilitySchema.optional(),
        children: z.array(defaultWidgetNodeSchema).optional(),
      })
      .strict()
      .refine(
        n =>
          (n.id !== undefined) !==
          (n.children !== undefined && n.children.length > 0),
        {
          message:
            'Node must have exactly one of `id` (leaf) or non-empty `children` (group)',
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
): DefaultWidgetNode[] {
  const raw = config.getOptional('homepage.defaultWidgets');
  if (raw === undefined) return [];
  const parsed = defaultWidgetsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid homepage.defaultWidgets config: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

/** Reads the `homepage.customizable` flag, defaulting to false. */
export function loadCustomizable(config: RootConfigService): boolean {
  return config.getOptionalBoolean('homepage.customizable') ?? false;
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
