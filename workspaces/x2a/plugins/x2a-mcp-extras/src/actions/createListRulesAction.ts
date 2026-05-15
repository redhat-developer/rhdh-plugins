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
import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

export function createListRulesAction(options: X2aActionsOptions) {
  const {
    actionsRegistry,
    auth,
    catalog,
    logger,
    permissionsSvc,
    x2aDatabase,
  } = options;

  actionsRegistry.register({
    name: 'x2a-list-rules',
    title: 'List X2A Rules',
    description: `List available rules for X2A migration projects.
Required rules are automatically applied to all projects.
Pass optional rule IDs to x2a-create-project to accept additional rules.`,
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    schema: {
      input: z => z.object({}),
      output: z =>
        z.object({
          rules: z
            .array(
              z.object({
                id: z.string().describe('UUID of the rule.'),
                title: z.string().describe('Title of the rule.'),
                description: z
                  .string()
                  .describe('Full description of the rule.'),
                required: z
                  .boolean()
                  .describe(
                    'Whether the rule is required for all projects (auto-applied).',
                  ),
                createdAt: z
                  .string()
                  .describe('ISO 8601 timestamp when the rule was created.'),
                updatedAt: z
                  .string()
                  .describe(
                    'ISO 8601 timestamp when the rule was last updated.',
                  ),
              }),
            )
            .describe('List of all available rules.'),
        }),
    },
    action: async ({ credentials }) => {
      logger.info('MCP tool x2a-list-rules invoked');

      await resolveCredentialsContext({
        credentials,
        auth,
        catalog,
        permissionsSvc,
        readOnly: true,
      });

      const rules = await x2aDatabase.listRules();

      return {
        output: {
          rules: rules.map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            required: r.required,
            createdAt:
              r.createdAt instanceof Date
                ? r.createdAt.toISOString()
                : String(r.createdAt),
            updatedAt:
              r.updatedAt instanceof Date
                ? r.updatedAt.toISOString()
                : String(r.updatedAt),
          })),
        },
      };
    },
  });
}
