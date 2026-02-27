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

export const createRetrieveTechDocsContentAction = ({
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
    name: 'retrieve-techdocs-content',
    title: 'Retrieve TechDocs Content',
    description: `Retrieve the actual TechDocs content for a specific entity and optional page.

      This tool allows AI clients to access documentation content for specific catalog entities.
      You can retrieve the main documentation page or specific pages within the entity's documentation.

      Example invocations and expected responses:
        Input: {
          "entityRef": "component:default/developer-model-service",
          "pagePath": "index.html"
        }

        Output: {
          "entityRef": "component:default/developer-model-service",
          "name": "developer-model-service",
          "title": "Developer Model Service",
          "kind": "component",
          "namespace": "default",
          "content": "Developer Model Service Documentation\n\nWelcome to the service...",
          "pageTitle": "Developer Model Service Documentation",
          "path": "index.html",
          "contentType": "text",
          "lastModified": "2024-01-15T10:30:00Z",
          "metadata": {
            "lastUpdated": "2024-01-15T10:30:00Z",
            "buildTimestamp": 1705313400,
            "siteName": "Developer Model Service Docs"
          }
        }

      Note: HTML files are automatically converted to plain text for better readability and AI processing.
      Supports retrieving specific pages by providing pagePath parameter (e.g., "api/endpoints.html", "guides/setup.md").`,
    schema: {
      input: z =>
        z.object({
          entityRef: z
            .string()
            .describe(
              'Entity reference in format kind:namespace/name (e.g., component:default/my-service)',
            ),
          pagePath: z
            .string()
            .optional()
            .describe(
              'Optional path to specific page within the documentation (defaults to index.html)',
            ),
        }),
      output: z =>
        z.object({
          entityRef: z
            .string()
            .describe('The entity reference that was requested'),
          name: z.string().describe('The name of the entity'),
          title: z.string().describe('The title of the entity'),
          kind: z
            .string()
            .describe('The kind of the entity (e.g., component, api)'),
          namespace: z.string().describe('The namespace of the entity'),
          content: z
            .string()
            .describe(
              'The actual documentation content (HTML automatically converted to plain text)',
            ),
          pageTitle: z
            .string()
            .optional()
            .describe('The title extracted from the page content'),
          path: z
            .string()
            .optional()
            .describe('The path to the requested page'),
          contentType: z
            .enum(['markdown', 'html', 'text'])
            .describe(
              'The type of content returned (HTML files are converted to text)',
            ),
          lastModified: z
            .string()
            .optional()
            .describe('ISO timestamp when the content was last modified'),
          metadata: z
            .object({
              lastUpdated: z
                .string()
                .optional()
                .describe('ISO timestamp when TechDocs were last updated'),
              buildTimestamp: z
                .number()
                .optional()
                .describe('Unix timestamp when TechDocs were built'),
              siteName: z
                .string()
                .optional()
                .describe('Name of the TechDocs site'),
              siteDescription: z
                .string()
                .optional()
                .describe('Description of the TechDocs site'),
            })
            .optional()
            .describe('TechDocs metadata information'),
          error: z
            .string()
            .optional()
            .describe('Error message if the operation failed'),
        }),
    },
    action: async ({ input }) => {
      try {
        const techDocsService = new TechDocsService(config, logger, discovery);
        const result = await techDocsService.retrieveTechDocsContent(
          input.entityRef,
          input.pagePath,
          auth,
          catalog,
        );

        return {
          output: result,
        };
      } catch (error) {
        logger.error(
          'retrieve-techdocs-content: Error retrieving TechDocs content:',
          error,
        );
        return {
          output: {
            entityRef: input.entityRef,
            name: '',
            title: '',
            kind: '',
            namespace: '',
            content: '',
            contentType: 'text' as const,
            error: error.message,
          },
        };
      }
    },
  });
};
