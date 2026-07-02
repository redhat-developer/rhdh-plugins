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
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description: `Search and retrieve catalog entities from the Backstage server.

List all Backstage entities such as Components, Systems, Resources, APIs, Locations, Users, and Groups.
By default, results are returned in JSON array format, where each entry in the JSON array is an entity with the following fields: 'name', 'description','type', 'owner', 'tags', 'dependsOn' and 'kind'.
Setting 'verbose' to true will return the full Backstage entity objects, but should only be used if the reduced output is not sufficient, as this will significantly impact context usage (especially on smaller models).
Note: 'type' can only be filtered on if a specified entity 'kind' is also specified.

Use the 'search' parameter for partial/substring matching across entity name, title, and description. Use the 'name' parameter only when you know the exact entity name.

Example invocations and the output from those invocations:
  # Search for entities by partial name or description
  query-catalog-entities search:postgres
  # Combine search with kind filter
  query-catalog-entities kind:Component search:auth
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
          name: z.string().optional().describe('Filter entities by exact name'),
          search: z
            .string()
            .optional()
            .describe(
              'Full-text search term to match against entity name, title, and description. Supports partial/substring matching unlike the exact-match name filter.',
            ),
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
                  title: z
                    .string()
                    .optional()
                    .describe(
                      'The human-friendly display title of the Backstage entity',
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
      if (input.name && input.search) {
        return {
          output: {
            entities: [],
            error:
              "cannot specify both 'name' (exact match) and 'search' (partial match) together",
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

const ABRIDGED_FIELDS = [
  'metadata.name',
  'metadata.title',
  'kind',
  'metadata.tags',
  'metadata.description',
  'spec.type',
  'spec.owner',
  'spec.lifecycle',
  'relations',
];

function buildFilter(input?: {
  kind?: string;
  type?: string;
  name?: string;
  owner?: string;
  tags?: string;
  lifecycle?: string;
}): Record<string, any> {
  const filter: Record<string, any> = {};
  if (input?.kind) filter.kind = input.kind;
  if (input?.type) filter['spec.type'] = input.type;
  if (input?.name) filter['metadata.name'] = input.name;
  if (input?.owner) filter['spec.owner'] = input.owner;
  if (input?.lifecycle) filter['spec.lifecycle'] = input.lifecycle;
  if (input?.tags) {
    filter['metadata.tags'] = input.tags.split(',').map(tag => tag.trim());
  }
  return filter;
}

function redactFilters(filter: Record<string, any>): Record<string, any> {
  const redacted = { ...filter };
  if (Object.hasOwn(redacted, 'metadata.name')) {
    redacted['metadata.name'] = '[REDACTED]';
  }
  if (Object.hasOwn(redacted, 'spec.owner')) {
    redacted['spec.owner'] = '[REDACTED]';
  }
  return redacted;
}

function toAbridgedEntity(entity: Entity) {
  return {
    name: entity.metadata.name,
    title: entity.metadata.title,
    kind: entity.kind,
    tags: entity.metadata.tags?.join(',') || '',
    description: entity.metadata.description,
    lifecycle:
      typeof entity.spec?.lifecycle === 'string'
        ? entity.spec.lifecycle
        : undefined,
    type:
      typeof entity.spec?.type === 'string' ? entity.spec.type : undefined,
    owner:
      typeof entity.spec?.owner === 'string' ? entity.spec.owner : undefined,
    dependsOn:
      entity.relations
        ?.filter(relation => relation.type === 'dependsOn')
        .map(relation => relation.targetRef)
        .join(',') || '',
  };
}

async function searchEntities(
  catalog: CatalogService,
  credentials: any,
  search: string,
  filter: Record<string, any>,
  fields?: string[],
): Promise<Entity[]> {
  const queryOptions: any = {
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    fullTextFilter: {
      term: search,
      fields: ['metadata.name', 'metadata.title', 'metadata.description'],
    },
    limit: 500,
  };
  if (fields) {
    queryOptions.fields = fields;
  }

  const items: Entity[] = [];
  let cursor: string | undefined;
  do {
    const request: any = cursor ? { cursor, limit: 500 } : queryOptions;
    const response = await catalog.queryEntities(request, { credentials });
    items.push(...response.items);
    cursor = response.pageInfo?.nextCursor;
  } while (cursor);
  return items;
}

export async function fetchCatalogEntities(
  catalog: CatalogService,
  credentials: any,
  logger: LoggerService,
  input?: {
    kind?: string;
    type?: string;
    name?: string;
    search?: string;
    owner?: string;
    tags?: string;
    lifecycle?: string;
    verbose?: boolean;
  },
) {
  const filter = buildFilter(input);
  const fields = input?.verbose ? undefined : ABRIDGED_FIELDS;
  const logEntityNames = process.env.LOG_ENTITY_NAMES === 'true';
  const loggedFilters = logEntityNames ? filter : redactFilters(filter);

  let items: Entity[];

  if (input?.search) {
    logger.info(
      'query-catalog-entities: Searching catalog entities with fullTextFilter:',
      { search: logEntityNames ? input.search : '[REDACTED]', ...loggedFilters },
    );
    items = await searchEntities(catalog, credentials, input.search, filter, fields);
  } else {
    logger.info(
      'query-catalog-entities: Fetching catalog entities with options:',
      loggedFilters,
    );

    const getEntitiesOptions: any = { filter };
    if (fields) {
      getEntitiesOptions.fields = fields;
    }

    const response = await catalog.getEntities(getEntitiesOptions, {
      credentials,
    });
    items = response.items;
  }

  return {
    entities: input?.verbose ? items : items.map(toAbridgedEntity),
  };
}
