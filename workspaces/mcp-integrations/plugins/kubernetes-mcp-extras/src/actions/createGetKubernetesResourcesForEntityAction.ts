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
import { stringifyEntityRef } from '@backstage/catalog-model';

type FetchApi = typeof import('node-fetch').default;

export const createGetKubernetesResourcesForEntityAction = ({
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
    name: 'get-kubernetes-resources-for-entity',
    title: 'Get Kubernetes Resources for Entity',
    description: `
Fetches all Kubernetes resources associated with a Backstage catalog entity across all registered clusters.

Results are grouped by cluster under \`items\`. Each entry includes the cluster info, resources grouped
by type (e.g. deployments, pods, services), pod metrics (if metrics-server is installed), and any errors.
Use this to inspect the live Kubernetes state of a service, such as rollout status, pod health, or replica counts.
    `,
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    schema: {
      input: z =>
        z.object({
          name: z.string().describe('The name of the catalog entity.'),
          kind: z
            .string()
            .optional()
            .describe(
              'The kind of the catalog entity. Defaults to "Component" if omitted.',
            ),
          namespace: z
            .string()
            .optional()
            .describe(
              'The namespace of the catalog entity. Defaults to "default" if omitted.',
            ),
        }),
      output: z =>
        z.object({
          items: z
            .array(z.unknown())
            .describe(
              'List of ClusterObjects, one per cluster. Each entry has cluster info, resources grouped by type, pod metrics, and any errors.',
            ),
        }),
    },
    examples: [
      {
        title: 'Get Kubernetes resources for a component',
        input: { name: 'my-service' },
        output: {
          items: [
            {
              cluster: { name: 'production' },
              resources: [
                {
                  type: 'deployments',
                  resources: [
                    {
                      metadata: { name: 'my-service', namespace: 'default' },
                      spec: { replicas: 3 },
                      status: { readyReplicas: 3 },
                    },
                  ],
                },
              ],
              podMetrics: [],
              errors: [],
            },
          ],
        },
      },
      {
        title: 'Get Kubernetes resources for a specific kind and namespace',
        input: { name: 'my-worker', kind: 'Service', namespace: 'production' },
      },
    ],
    action: async ({ input, credentials, logger }) => {
      const entityRef = stringifyEntityRef({
        kind: input.kind ?? 'Component',
        namespace: input.namespace ?? 'default',
        name: input.name,
      });

      logger.info(`Fetching Kubernetes resources for entity "${entityRef}"`);

      const baseUrl = await discovery.getBaseUrl('kubernetes');
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'kubernetes',
      });

      const fetch = fetchApi ?? (await import('node-fetch')).default;
      const response = await fetch(`${baseUrl}/resources/workloads/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // An empty `auth` object tells the Kubernetes backend to use the
        // server-side configured credentials (service account, etc.) rather
        // than provider-specific tokens that only browser clients supply.
        body: JSON.stringify({ entityRef, auth: {} }),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(
          `Failed to fetch Kubernetes resources for entity "${entityRef}": ${message}`,
        );
      }

      const body = (await response.json()) as { items: unknown[] };

      return {
        output: {
          items: body.items,
        },
      };
    },
  });
};

async function extractErrorMessage(response: {
  status: number;
  statusText: string;
  text: () => Promise<string>;
}): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`;
  try {
    const parsed = JSON.parse(await response.text());
    return parsed?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
