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
  ActionsRegistryService,
  type ActionsService,
} from '@backstage/backend-plugin-api/alpha';
import { BackstageCredentials } from '@backstage/backend-plugin-api';

/**
 * Minimal interface for listing scaffolder/template actions.
 * Used so we do not depend on the non-exported TemplateActionRegistry from
 * @backstage/plugin-scaffolder-backend. Any implementation that can list
 * actions with this shape (e.g. TemplateActionRegistry) can be passed in.
 *
 * @internal
 */
export interface ScaffolderActionsListProvider {
  list(options: { credentials: BackstageCredentials }): Promise<
    Map<
      string,
      {
        id: string;
        description?: string;
        schema?: { input?: unknown; output?: unknown };
        examples?: unknown[];
      }
    >
  >;
}

/**
 * Builds a ScaffolderActionsListProvider from the backend ActionsService.
 * Lists all actions registered with the backend (e.g. MCP actions and any
 * template actions exposed via the actions service).
 *
 * @public
 */
export function scaffolderActionsListProviderFromActionsService(
  actionsService: ActionsService,
): ScaffolderActionsListProvider {
  return {
    async list({ credentials }) {
      const { actions } = await actionsService.list({ credentials });
      return new Map(
        actions.map(a => [
          a.id,
          {
            id: a.id,
            description: a.description,
            schema: {
              input: a.schema?.input ?? {},
              output: a.schema?.output ?? {},
            },
            examples: [],
          },
        ]),
      );
    },
  };
}

export const createListScaffolderActionsAction = ({
  actionsRegistry,
  templateActionRegistry,
}: {
  actionsRegistry: ActionsRegistryService;
  /**
   * Optional. When provided, returns the real list from the registry.
   * When omitted, the action is still registered but returns an empty list when invoked.
   */
  templateActionRegistry?: ScaffolderActionsListProvider;
}) => {
  actionsRegistry.register({
    name: 'list-scaffolder-actions',
    title: 'List Scaffolder Actions',
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description: `Lists all installed Scaffolder actions.
Each action includes:
- id: The action identifier
- description: What the action does
- schema: Input and output JSON schemas
- examples: Usage examples (if available)`,
    schema: {
      input: z => z.object({}).describe('No input is required'),
      output: z =>
        z.object({
          actions: z.array(
            z.object({
              id: z.string(),
              description: z.string(),
              schema: z.object({
                input: z
                  .object({})
                  .passthrough()
                  .describe('JSON Schema for input of Action'),
                output: z
                  .object({})
                  .passthrough()
                  .describe('JSON Schema for output of Action'),
              }),
              examples: z.array(z.any()).optional(),
            }),
          ),
        }),
    },
    action: async ({ credentials }) => {
      if (!templateActionRegistry) {
        return { output: { actions: [] } };
      }
      const actionsMap = await templateActionRegistry.list({ credentials });
      const scaffolderActions = Array.from(actionsMap.values()).map(action => ({
        id: action.id,
        description: action.description ?? '',
        schema: {
          input: { ...(action.schema?.input ?? {}) },
          output: { ...(action.schema?.output ?? {}) },
        },
        examples: action.examples ?? [],
      }));
      return {
        output: {
          actions: scaffolderActions.sort((a, b) => a.id.localeCompare(b.id)),
        },
      };
    },
  });
};
