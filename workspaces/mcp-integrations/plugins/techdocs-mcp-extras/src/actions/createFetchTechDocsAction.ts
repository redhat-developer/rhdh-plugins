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
import { LoggerService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogService } from '@backstage/plugin-catalog-node';
import type { Config } from '@backstage/config';
import { TechDocsService } from '../service';

export const createFetchTechDocsAction = ({
  actionsRegistry,
  catalog,
  auth,
  logger,
  config,
  discovery,
}: {
  actionsRegistry: ActionsRegistryService;
  catalog: CatalogService;
  auth: any;
  logger: LoggerService;
  config: Config;
  discovery: DiscoveryService;
}) => {
  actionsRegistry.register({
    name: 'fetch-techdocs',
    title: 'Fetch TechDoc Entities',
    description: `Search and retrieve all TechDoc entities from the Backstage Server

      List all Backstage entities with techdocs. Results are returned in JSON array format, where each
      entry includes entity details and TechDocs metadata, like last update timestamp and build information.

      Example invocations and the output from those invocations:
        Output: {
          "entities": [
            {
              "name": "developer-model-service",
              "title": "Developer Model Service",
              "tags": [
                "genai",
                "ibm-granite"
              ],
              "description": "A description",
              "owner": "user:default/exampleuser",
              "lifecycle": "experimental",
              "namespace": "default",
              "kind": "Component",
              "techDocsUrl": "https://backstage.example.com/docs/default/component/developer-model-service",
              "metadataUrl": "https://backstage.example.com/api/techdocs/default/component/developer-model-service",
              "metadata": {
                "lastUpdated": "2024-01-15T10:30:00Z",
                "buildTimestamp": 1705313400,
                "siteName": "Developer Model Service Docs",
                "siteDescription": "Documentation for the developer model service"
              }
            }
          ]
        }
      }
`,
    schema: {
      input: z =>
        z.object({
          entityType: z
            .string()
            .optional()
            .describe('Filter by entity type (e.g., Component, API, System)'),
          namespace: z.string().optional().describe('Filter by namespace'),
          owner: z
            .string()
            .optional()
            .describe('Filter by owner (e.g., team-platform, user:john.doe)'),
          lifecycle: z
            .string()
            .optional()
            .describe(
              'Filter by lifecycle (e.g., production, staging, development)',
            ),
          tags: z // Don't define using arrays - some mcp clients (notably llama stack) have issues decoding them (more investigation needed)
            .string()
            .optional()
            .describe(
              'Filter by tags as comma-separated values (e.g., "genai,frontend,api")',
            ),
        }),
      output: z =>
        z.object({
          entities: z
            .array(
              z.object({
                name: z
                  .string()
                  .describe(
                    'The name field for each techdoc in the backstage server',
                  ),
                title: z
                  .string()
                  .describe(
                    'The title field for each techdoc in the backstage server',
                  ),
                tags: z
                  .string()
                  .optional()
                  .describe(
                    'The tags related with the techdoc entity as comma-separated values',
                  ),
                description: z
                  .string()
                  .describe('The description of the techdoc entity'),
                owner: z
                  .string()
                  .describe(
                    'The owner of the techdoc entity (e.g., team-platform, user:john.doe)',
                  ),
                lifecycle: z
                  .string()
                  .describe(
                    'The lifecycle of the techdoc entity (e.g., production, staging, development)',
                  ),
                namespace: z
                  .string()
                  .describe('The namespace of the techdoc entity'),
                kind: z
                  .string()
                  .describe(
                    'The kind of the techdoc entity (e.g., Component, API, System)',
                  ),
                techDocsUrl: z
                  .string()
                  .describe('Direct URL to the TechDocs site for this entity'),
                metadataUrl: z
                  .string()
                  .describe(
                    'API URL to access TechDocs metadata for this entity',
                  ),
                metadata: z
                  .object({
                    lastUpdated: z
                      .string()
                      .optional()
                      .describe('Last updated TechDoc timestamp'),
                    buildTimestamp: z
                      .number()
                      .optional()
                      .describe('Built TechDoc timestamp'),
                    siteName: z
                      .string()
                      .optional()
                      .describe('Name of the TechDocs site'),
                    siteDescription: z
                      .string()
                      .optional()
                      .describe('Description of the TechDocs site'),
                    etag: z
                      .string()
                      .optional()
                      .describe('ETag for caching purposes'),
                    files: z
                      .string()
                      .optional()
                      .describe(
                        'List of files in the TechDocs site as comma-separated values',
                      ),
                  })
                  .optional()
                  .describe('TechDocs metadata information'),
              }),
            )
            .describe('List of entities with TechDocs'),
          error: z
            .string()
            .optional()
            .describe('Error message if the operation failed'),
        }),
    },
    action: async ({ input }) => {
      try {
        const techDocsService = new TechDocsService(config, logger, discovery);
        const result = await techDocsService.listTechDocs(input, auth, catalog);
        return {
          output: {
            ...result,
          },
        };
      } catch (error) {
        logger.error('fetch-techdocs: Error fetching TechDoc entities:', error);
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
