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

export const createAnalyzeTechDocsCoverageAction = ({
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
    name: 'analyze-techdocs-coverage',
    title: 'Analyze TechDocs Coverage',
    description: `Analyze documentation coverage across Backstage entities to understand what percentage of entities have TechDocs available.

      It calculates the percentage of entities that have TechDocs configured, helping identify documentation gaps and improve overall documentation coverage.

      Example output:
      {
        "totalEntities": 150,
        "entitiesWithDocs": 95,
        "coveragePercentage": 63.3
      }

      Supports filtering by entity type, namespace, owner, lifecycle, and tags to analyze coverage for specific subsets of entities.`,
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
          tags: z
            .string()
            .optional()
            .describe(
              'Filter by tags as comma-separated values (e.g., "genai,frontend,api")',
            ),
        }),
      output: z =>
        z.object({
          totalEntities: z
            .number()
            .describe('Total number of entities in the filtered set'),
          entitiesWithDocs: z
            .number()
            .describe('Number of entities that have TechDocs configured'),
          coveragePercentage: z
            .number()
            .describe('Percentage of entities with TechDocs (0-100)'),
          error: z
            .string()
            .optional()
            .describe('Error message if the operation failed'),
        }),
    },
    action: async ({ input }) => {
      try {
        const techDocsService = new TechDocsService(config, logger, discovery);
        const result = await techDocsService.analyzeCoverage(
          input,
          auth,
          catalog,
        );
        return {
          output: result,
        };
      } catch (error) {
        logger.error(
          'analyze-techdocs-coverage: Error analyzing coverage:',
          error,
        );
        return {
          output: {
            totalEntities: 0,
            entitiesWithDocs: 0,
            coveragePercentage: 0,
            error: error.message,
          },
        };
      }
    },
  });
};
