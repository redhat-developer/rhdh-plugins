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
  coreServices,
  createBackendPlugin,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  CatalogService,
  catalogServiceRef,
} from '@backstage/plugin-catalog-node';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';

/**
 * mcpScaffolderExtrasPlugin backend plugin
 *
 * @public
 */
export const mcpScaffolderExtrasPlugin = createBackendPlugin({
  pluginId: 'scaffolder-mcp-extras',
  register(env) {
    env.registerInit({
      deps: {
        actionsRegistry: actionsRegistryServiceRef,
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
      },
      async init({ actionsRegistry, catalog, auth, logger }) {
        actionsRegistry.register({
          name: 'fetch-template-metadata',
          title: 'Fetch Software Template Metadata',
          description: `Search and retrieve Software Template metadata from the Backstage catalog.

This tool retrieves Backstage Software Templates with their configuration details including parameters and steps. 
It can be called without filters to list all templates, or filtered by name, title, or uid to find specific templates.
For additional information related to the fetched Software Template metadata, you can call an available Tech Docs retrieval tool to receive the documentation
for the Templates as well.

Returns template-specific fields including:
- Basic metadata (name, tags, labels, description, owner)
- Template parameters (as JSON string)
- Template steps/workflow (as JSON string)

When to use this tool:
- List all available Software Templates
- Search for templates by name, title, or unique identifier
- Get template configuration details (parameters, steps)
`,
          schema: {
            input: z =>
              z.object({
                name: z.string().optional().describe('Filter Template by name'),
                title: z
                  .string()
                  .optional()
                  .describe('Filter Template by Title.'),
                uid: z
                  .string()
                  .optional()
                  .describe('Filter Template by Unique Identifier.'),
              }),
            output: z =>
              z.object({
                templates: z
                  .array(
                    z.object({
                      name: z
                        .string()
                        .describe(
                          'The name field for the Backstage Software Template in the catalog',
                        ),
                      tags: z
                        .string()
                        .optional()
                        .describe(
                          'The tags associated with the Backstage Software Template as comma-separated values',
                        ),
                      labels: z
                        .string()
                        .optional()
                        .describe(
                          'The labels associated with the Backstage Software Template as comma-separated values',
                        ),
                      description: z
                        .string()
                        .optional()
                        .describe(
                          'The description of the Backstage Software Template',
                        ),
                      owner: z
                        .string()
                        .optional()
                        .describe(
                          'The owner of the Backstage Software Template (e.g., team-platform, user:john.doe)',
                        ),
                      parameters: z
                        .string()
                        .optional()
                        .describe(
                          'The parameters of the Backstage Software Template as JSON string',
                        ),
                      steps: z
                        .string()
                        .optional()
                        .describe(
                          'The steps of the Backstage Software Template as JSON string',
                        ),
                    }),
                  )
                  .describe('An array of Software Template metadata'),
                error: z
                  .string()
                  .optional()
                  .describe('Error message if the operation fails'),
              }),
          },
          action: async ({ input }) => {
            try {
              const result = await fetchSoftwareTemplateMetadata(
                catalog,
                auth,
                logger,
                input,
              );
              return {
                output: {
                  ...result,
                  error: undefined,
                },
              };
            } catch (error) {
              logger.error(
                'fetch-template-metadata: Error fetching template metadata:',
                error,
              );
              return {
                output: {
                  templates: [],
                  error: error.message,
                },
              };
            }
          },
        });
      },
    });
  },
});

export async function fetchSoftwareTemplateMetadata(
  catalog: CatalogService,
  auth: any,
  logger: LoggerService,
  input?: {
    name?: string;
    title?: string;
    uid?: string;
  },
) {
  const credentials = await auth.getOwnServiceCredentials();

  const filter: any = {
    kind: 'Template', // Only fetch Template entities
  };

  if (input?.name) {
    filter['metadata.name'] = input.name;
  }
  if (input?.title) {
    filter['metadata.title'] = input.title;
  }
  if (input?.uid) {
    filter['metadata.uid'] = input.uid;
  }

  const getEntitiesOptions: any = {
    filter,
    fields: [
      'metadata.name',
      'metadata.tags',
      'metadata.labels',
      'metadata.description',
      'spec.owner',
      'spec.parameters',
      'spec.steps',
    ],
  };

  logger.info(
    'fetch-template-metadata: Fetching template metadata with options:',
    filter,
  );

  const { items } = await catalog.getEntities(getEntitiesOptions, {
    credentials,
  });

  return {
    templates: items.map(template => ({
      name: template.metadata.name,
      tags: template.metadata.tags?.join(',') || undefined,
      labels: template.metadata.labels
        ? Object.entries(template.metadata.labels)
            .map(([k, v]) => `${k}:${v}`)
            .join(',')
        : undefined,
      description: template.metadata.description,
      owner:
        typeof template.spec?.owner === 'string'
          ? template.spec.owner
          : undefined,
      parameters: template.spec?.parameters
        ? JSON.stringify(template.spec.parameters)
        : undefined,
      steps: template.spec?.steps
        ? JSON.stringify(template.spec.steps)
        : undefined,
    })),
  };
}
