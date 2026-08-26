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
import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

type FetchApi = typeof import('node-fetch').default;

export const createGetKubernetesClustersAction = ({
  actionsRegistry,
  auth,
  discovery,
  fetchApi,
}: {
  actionsRegistry: ActionsRegistryService;
  auth: AuthService;
  discovery: DiscoveryService;
  fetchApi?: FetchApi;
}) => {
  actionsRegistry.register({
    name: 'get-kubernetes-clusters',
    title: 'Get Kubernetes Clusters',
    description: `
Lists all Kubernetes clusters registered with this Backstage instance.

Each cluster entry includes its internal \`name\` (the identifier used in other actions and config),
an optional human-readable \`title\`, and an optional \`dashboardUrl\`. Use this to discover which
clusters exist before looking up resources on a specific cluster.
    `,
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    schema: {
      input: z => z.object({}),
      output: z =>
        z.object({
          clusters: z
            .array(
              z.object({
                name: z
                  .string()
                  .describe(
                    'Unique internal name of the cluster, used as an identifier in other actions.',
                  ),
                title: z
                  .string()
                  .optional()
                  .describe(
                    'Human-readable display name for the cluster, if configured.',
                  ),
                dashboardUrl: z
                  .string()
                  .optional()
                  .describe(
                    'URL to the Kubernetes dashboard for this cluster.',
                  ),
              }),
            )
            .describe('List of all registered Kubernetes clusters.'),
        }),
    },
    examples: [
      {
        title: 'List all clusters',
        input: {},
        output: {
          clusters: [
            { name: 'production', title: 'Production Cluster' },
            {
              name: 'staging',
              title: 'Staging Cluster',
              dashboardUrl: 'https://dashboard.staging.example.com',
            },
          ],
        },
      },
    ],
    action: async ({ credentials, logger }) => {
      logger.info('Fetching Kubernetes clusters');

      const baseUrl = await discovery.getBaseUrl('kubernetes');
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'kubernetes',
      });

      const fetch = fetchApi ?? (await import('node-fetch')).default;
      const response = await fetch(`${baseUrl}/clusters`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Kubernetes clusters: ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as {
        items: Array<{ name: string; title?: string; dashboardUrl?: string }>;
      };

      return {
        output: {
          clusters: body.items.map(cd => ({
            name: cd.name,
            ...(cd.title && { title: cd.title }),
            ...(cd.dashboardUrl && { dashboardUrl: cd.dashboardUrl }),
          })),
        },
      };
    },
  });
};
