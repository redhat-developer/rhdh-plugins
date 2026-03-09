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
import { LoggerService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';

export const createQueryCatalogEntitiesAction = ({
  actionsRegistry,
  catalog,
  logger,
}: {
  actionsRegistry: ActionsRegistryService;
  catalog: CatalogService;
  logger: LoggerService;
}) => {
  actionsRegistry.register({
    name: 'query-catalog-entities',
    title: 'Fetch Catalog Entities',
    description: `Search and retrieve catalog entities from the Backstage server.

List all Backstage entities such as Components, Systems, Resources, APIs, Locations, Users, and Groups. 
By default, results are returned in JSON array format, where each entry in the JSON array is an entity with the following fields: 'name', 'description','type', 'owner', 'tags', 'dependsOn' and 'kind'.
Setting 'verbose' to true will return the full Backstage entity objects, but should only be used if the reduced output is not sufficient, as this will significantly impact context usage (especially on smaller models).
Note: 'type' can only be filtered on if a specified entity 'kind' is also specified.

Example invocations and the output from those invocations:
  # Find all Resources of type storage
  query-catalog-entities kind:Resource type:storage
  Output: {
  "entities": [
    {
      "name": "ibm-granite-s3-bucket",
      "kind": "Resource",
      "type": "storage",
      "tags": [
        "genai",
        "ibm",
        "llm",
        "granite",
        "conversational",
        "task-text-generation"
      ]
    }
  ]


`,
    // End tool description
    schema: {
      input: z =>
        z.object({
          kind: z
            .string()
            .optional()
            .describe('Filter entities by kind (e.g., Component, API, System)'),
          type: z
            .string()
            .optional()
            .describe(
              'Filter entities by type (e.g., ai-model, library, website).',
            ),
          name: z.string().optional().describe('Filter entities by name'),
          owner: z
            .string()
            .optional()
            .describe(
              'Filter entities by owner (e.g., team-platform, user:john.doe)',
            ),
          lifecycle: z
            .string()
            .optional()
            .describe(
              'Filter entities by lifecycle (e.g., production, staging, development)',
            ),
          tags: z // Don't define using arrays - some mcp clients (notably llama stack) have issues decoding them (more investigation needed)
            .string()
            .optional()
            .describe(
              'Filter entities by tags as comma-separated values (e.g., "genai,ibm,llm,granite,conversational,task-text-generation")',
            ),
          verbose: z
            .boolean()
            .optional()
            .describe(
              'If true, returns the full Backstage Entity object from the API rather than the shortened output.',
            ),
        }),
      output: z =>
        z.object({
          entities: z
            .array(
              z.union([
                z.object({
                  name: z
                    .string()
                    .describe(
                      'The name field for each Backstage entity in the catalog',
                    ),
                  kind: z
                    .string()
                    .describe(
                      'The kind/type of the Backstage entity (e.g., Component, API, System)',
                    ),
                  tags: z
                    .string()
                    .optional()
                    .describe(
                      'The tags associated with the Backstage entity as comma-separated values',
                    ),
                  description: z
                    .string()
                    .optional()
                    .describe('The description of the Backstage entity'),
                  type: z
                    .string()
                    .optional()
                    .describe(
                      'The type of the Backstage entity (e.g., service, library, website)',
                    ),
                  owner: z
                    .string()
                    .optional()
                    .describe(
                      'The owner of the Backstage entity (e.g., team-platform, user:john.doe)',
                    ),
                  lifecycle: z
                    .string()
                    .optional()
                    .describe(
                      'The lifecycle of the Backstage entity (e.g., production, staging, development)',
                    ),
                  dependsOn: z
                    .string()
                    .optional()
                    .describe(
                      'List of entities this entity depends on as comma-separated values (e.g., "component:default/database,api:default/external-service")',
                    ),
                }),
                z.custom<Entity>(),
              ]),
            )
            .describe(
              'An array of entities (either Backstage Entity objects or shortened entity information based on verbose parameter)',
            ),
          error: z
            .string()
            .optional()
            .describe('Error message if validation fails'),
        }),
    },
    action: async ({ input, credentials }) => {
      // Validate that type is only used with kind -- we could just allow `type` to be specified without `kind` but given types are per kind it made sense to restrict it
      // The Backstage MCP server will return a 500 error if we throw a validation error (without saying why), so instead, let's return the error message in the output
      // TODO: Investigate potential upstream improvements to allow error messages to be returned to the client
      if (input.type && !input.kind) {
        return {
          output: {
            entities: [],
            error:
              'entity type cannot be specified without an entity kind specified',
          },
        };
      }
      try {
        const result = await fetchCatalogEntities(
          catalog,
          credentials,
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
          'query-catalog-entities: Error fetching catalog entities:',
          error,
        );
        return {
          output: {
            entities: [],
            error: error.message,
          },
        };
      }
    },
  });
};

export async function fetchCatalogEntities(
  catalog: CatalogService,
  credentials: any,
  logger: LoggerService,
  input?: {
    kind?: string;
    type?: string;
    name?: string;
    owner?: string;
    tags?: string;
    lifecycle?: string;
    verbose?: boolean;
  },
) {
  const filter: any = {};
  if (input?.kind) {
    filter.kind = input.kind;
  }
  if (input?.type) {
    filter['spec.type'] = input.type;
  }
  if (input?.name) {
    filter['metadata.name'] = input.name;
  }
  if (input?.owner) {
    filter['spec.owner'] = input.owner;
  }
  if (input?.lifecycle) {
    filter['spec.lifecycle'] = input.lifecycle;
  }
  if (input?.tags) {
    filter['metadata.tags'] = input.tags.split(',').map(tag => tag.trim());
  }

  const getEntitiesOptions: any = {
    filter,
  };

  if (!input?.verbose) {
    getEntitiesOptions.fields = [
      'metadata.name',
      'kind',
      'metadata.tags',
      'metadata.description',
      'spec.type',
      'spec.owner',
      'spec.lifecycle',
      'relations',
    ];
  }

  const logEntityNames = process.env.LOG_ENTITY_NAMES === 'true';
  const loggedFilters = {
    ...getEntitiesOptions.filter,
  };
  if (!logEntityNames) {
    if (Object.prototype.hasOwnProperty.call(loggedFilters, 'metadata.name')) {
      loggedFilters['metadata.name'] = '[REDACTED]';
    }
    if (Object.prototype.hasOwnProperty.call(loggedFilters, 'spec.owner')) {
      loggedFilters['spec.owner'] = '[REDACTED]';
    }
  }
  logger.info(
    'query-catalog-entities: Fetching catalog entities with options:',
    loggedFilters,
  );

  const { items } = await catalog.getEntities(getEntitiesOptions, {
    credentials,
  });

  return {
    entities: input?.verbose
      ? items
      : items.map(entity => ({
          name: entity.metadata.name,
          kind: entity.kind,
          tags: entity.metadata.tags?.join(',') || '',
          description: entity.metadata.description,
          lifecycle:
            typeof entity.spec?.lifecycle === 'string'
              ? entity.spec.lifecycle
              : undefined,
          type:
            typeof entity.spec?.type === 'string'
              ? entity.spec.type
              : undefined,
          owner:
            typeof entity.spec?.owner === 'string'
              ? entity.spec.owner
              : undefined,
          dependsOn:
            entity.relations
              ?.filter(relation => relation.type === 'dependsOn')
              .map(relation => relation.targetRef)
              .join(',') || '',
        })),
  };
}
