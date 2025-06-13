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
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  CatalogClient,
  CatalogRequestOptions,
  // GetEntitiesByRefsRequest,
} from '@backstage/catalog-client';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { EntityEnvelope } from '@backstage/catalog-model'; // For typing the response

// TEMPLATE NOTE:
// This is a simple in-memory todo list store. It is recommended to use a
// database to store data in a real application. See the database service
// documentation for more information on how to do this:
// https://backstage.io/docs/backend-system/core-services/database
export function createServer({
  auth,
  discovery,
  logger,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  logger: LoggerService;
}): McpServer {
  logger.info('Initializing ConfigurableMcpServer');

  const server = new McpServer(
    {
      name: 'configurable-backstage-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  const f = z.object({
    kind: z
      .string()
      .toLowerCase()
      .pipe(
        z.enum([
          'component',
          'resource',
          'system',
          'api',
          'location',
          'user',
          'group',
        ]),
      ),
    // metadata: z.object({
    //   name: z.string(),
    //   namespace: z.string(),
    //   annotations: z.record(z.string(), z.string()),
    // }).optional(),
    // description: z.string().optional(),
    // tags: z.array(z.string()).optional(),
    // spec: z.object({
    //   type: z.string(),
    //   owner: z.string()
    // }).optional()
  });

  const catalogClient = new CatalogClient({ discoveryApi: discovery });

  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_entities',
          description:
            "List Backstage entities such as Components, Systems, Resources, APIs, Locations, Users, and Groups. Results are returned in JSON array format, where each entry is an object containing the entity 'name' and 'uid'.",
          inputSchema: zodToJsonSchema(f),
        },
        {
          name: 'get_entity_details',
          description:
            'Retrieve an entity such as a Component, System, Resource, API, Location, User, or Group by its uid. Results are returned in JSON format.',
          inputSchema: zodToJsonSchema(
            z.object({
              uid: z
                .string()
                .describe(
                  'The unique ID (uid) of the entity. This is a UUID, e.g UUID v4 format string',
                ),
            }),
          ),
        },
      ],
    };
  });

  server.server.setRequestHandler(CallToolRequestSchema, async request => {
    try {
      if (!request.params.arguments) {
        throw new Error('Arguments are required for a tool call.');
      }

      logger.info(`Received tool call "${request.params.name}"`);

      switch (request.params.name) {
        case 'list_entities': {
          const filter: Record<string, string> = {
            kind: request.params.arguments.kind as any,
          };
          const tok = getAuthToken(auth);
          const options: CatalogRequestOptions = {
            token: (await tok).token,
          };
          const entities = await catalogClient.getEntities({ filter }, options);

          /*
          // GGM attempt at using CatalogService ... got stuck on the credentials for CatalogServiceRequestOptions
          const entityRequest: GetEntitiesRequest = {
            filter: kindFilter,
          }
        
          const options: CatalogServiceRequestOptions = {

          };
          
          const entities = await catalog.getEntities(entityRequest, options)
          */

          const text = JSON.stringify(
            entities.items.map((e: any) => {
              return { uid: e.metadata.uid, name: e.metadata.name };
            }),
          );

          return {
            content: [
              {
                type: 'text',
                text,
              },
            ],
          };
        }

        case 'get_entity_details': {
          const tok = getAuthToken(auth);
          const myToken = (await tok).token;
          /* GGM failed attempt with getEntitiesByRef
          const options: CatalogRequestOptions = {
            token: (await tok).token
          }
          const ref: GetEntitiesByRefsRequest = {
            entityRefs: [request.params.arguments.uid as any]
          }
        
          const e = await catalogClient.getEntitiesByRefs(ref, options) // TODO verify input
          */

          const uid = request.params.arguments.uid as any;
          const baseURL = await discovery.getBaseUrl('catalog');
          const fetchAPI = {
            fetch: fetch,
          };

          const response = await fetchAPI.fetch(
            `${baseURL}/entities/by-uid/${uid}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${myToken}`,
              },
            },
          );
          if (!response.ok) {
            const payload = await response.json();
            const payloadString = payload as string;
            logger.warn(
              `Error in get_entity_details for UID ${uid}: ${payloadString}`,
            );
            logger.error(payload);
            throw new Error(
              `Error in get_entity_details for UID ${uid}: ${payloadString}`,
            );
          }
          const entity = (await response.json()) as EntityEnvelope;

          return {
            // content: [{ type: "text", text: JSON.stringify(e, null, 2) }],
            content: [{ type: 'text', text: JSON.stringify(entity, null, 2) }],
          };
        }

        default:
          throw new Error(`Unknown tool call "${request.params.name}"`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
      }

      throw error;
    }
  });

  return server;
}

async function getAuthToken(auth: AuthService): Promise<{ token: string }> {
  return await auth.getPluginRequestToken({
    targetPluginId: 'catalog',
    onBehalfOf: await auth.getOwnServiceCredentials(),
  });
}
