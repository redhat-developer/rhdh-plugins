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

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { mockApis, registerMswTestHooks } from '@backstage/test-utils';
import type { DiscoveryApi } from '@backstage/core-plugin-api';
import { CostManagementSlimClient } from './CostManagementSlimClient';

/** Matches mockApis.discovery({ baseUrl }) → `${baseUrl}/api/cost-management` */
const BACKSTAGE_ORIGIN = 'https://backstage:1234';
const PLUGIN_BASE_URL = `${BACKSTAGE_ORIGIN}/api/cost-management`;

/**
 * Backend discovery for cost-management returns the HCC API host (not the
 * plugin base URL), matching OptimizationsClient's direct path.
 */
const HCC_API_BASE_URL = 'https://console.redhat.com/api';

const server = setupServer();
registerMswTestHooks(server);

function createClient(discoveryApi: DiscoveryApi) {
  return new CostManagementSlimClient({
    discoveryApi,
    // Real fetch — MSW intercepts outbound HTTP (Backstage remote-service guidance)
    fetchApi: { fetch: globalThis.fetch },
  });
}

describe('CostManagementSlimClient resource-type URLs', () => {
  describe('frontend / proxy path (no token)', () => {
    const discoveryApi = mockApis.discovery({ baseUrl: BACKSTAGE_ORIGIN });

    it('searchOpenShiftClusters calls the secure proxy resource-types path', async () => {
      let requestedUrl = '';
      server.use(
        http.get(
          `${PLUGIN_BASE_URL}/proxy/resource-types/openshift-clusters/`,
          ({ request }) => {
            requestedUrl = request.url;
            return HttpResponse.json({
              data: [{ value: 'uuid-1', cluster_alias: 'demolab' }],
            });
          },
        ),
      );

      const response = await createClient(discoveryApi).searchOpenShiftClusters(
        '',
        { limit: 1000 },
      );
      const body = await response.json();

      expect(requestedUrl).toContain(
        `${PLUGIN_BASE_URL}/proxy/resource-types/openshift-clusters/`,
      );
      expect(requestedUrl).toContain('limit=1000');
      expect(requestedUrl).not.toContain('/cost-management/v1/');
      expect(body.data).toEqual([
        { value: 'uuid-1', cluster_alias: 'demolab' },
      ]);
    });

    it('searchOpenShiftProjects calls the secure proxy resource-types path', async () => {
      let requestedUrl = '';
      server.use(
        http.get(
          `${PLUGIN_BASE_URL}/proxy/resource-types/openshift-projects/`,
          ({ request }) => {
            requestedUrl = request.url;
            return HttpResponse.json({
              data: [{ value: 'kube-system' }],
            });
          },
        ),
      );

      const response = await createClient(discoveryApi).searchOpenShiftProjects(
        'kube',
      );
      const body = await response.json();

      expect(requestedUrl).toContain(
        `${PLUGIN_BASE_URL}/proxy/resource-types/openshift-projects/`,
      );
      expect(requestedUrl).toContain('search=kube');
      expect(requestedUrl).not.toContain('/cost-management/v1/');
      expect(body.data).toEqual([{ value: 'kube-system' }]);
    });
  });

  describe('backend / direct HCC path (token provided)', () => {
    // Functional mockApis.discovery always appends /api/<pluginId>; backend
    // wiring returns the HCC host instead, so use .mock() with an override.
    const discoveryApi = mockApis.discovery.mock({
      getBaseUrl: async () => HCC_API_BASE_URL,
    });

    it('searchOpenShiftClusters calls cost-management/v1 directly with bearer token', async () => {
      let requestedUrl = '';
      let authHeader = '';
      server.use(
        http.get(
          `${HCC_API_BASE_URL}/cost-management/v1/resource-types/openshift-clusters/`,
          ({ request }) => {
            requestedUrl = request.url;
            authHeader = request.headers.get('Authorization') ?? '';
            return HttpResponse.json({
              data: [
                {
                  value: 'uuid-azure',
                  cluster_alias: 'Openshift on Azure',
                },
              ],
            });
          },
        ),
      );

      const response = await createClient(discoveryApi).searchOpenShiftClusters(
        '',
        {
          token: 'sso-token',
          limit: 1000,
        },
      );
      const body = await response.json();

      expect(requestedUrl).toContain(
        `${HCC_API_BASE_URL}/cost-management/v1/resource-types/openshift-clusters/`,
      );
      expect(requestedUrl).toContain('limit=1000');
      expect(requestedUrl).not.toContain('/proxy/');
      expect(authHeader).toBe('Bearer sso-token');
      expect(body.data[0].cluster_alias).toBe('Openshift on Azure');
      expect(discoveryApi.getBaseUrl).toHaveBeenCalledWith('cost-management');
    });

    it('searchOpenShiftProjects calls cost-management/v1 directly with bearer token', async () => {
      let requestedUrl = '';
      let authHeader = '';
      server.use(
        http.get(
          `${HCC_API_BASE_URL}/cost-management/v1/resource-types/openshift-projects/`,
          ({ request }) => {
            requestedUrl = request.url;
            authHeader = request.headers.get('Authorization') ?? '';
            return HttpResponse.json({
              data: [{ value: 'weather' }],
            });
          },
        ),
      );

      const response = await createClient(discoveryApi).searchOpenShiftProjects(
        '',
        {
          token: 'sso-token',
          limit: 1000,
        },
      );
      const body = await response.json();

      expect(requestedUrl).toContain(
        `${HCC_API_BASE_URL}/cost-management/v1/resource-types/openshift-projects/`,
      );
      expect(requestedUrl).not.toContain('/proxy/');
      expect(authHeader).toBe('Bearer sso-token');
      expect(body.data).toEqual([{ value: 'weather' }]);
    });

    it('does not use the broken /api/proxy/resource-types path against HCC', async () => {
      // Regression: pre-fix backend built https://console.redhat.com/api/proxy/...
      // which returns 404 "Undefined Insights application".
      let hitBrokenProxyPath = false;
      let hitDirectPath = false;

      server.use(
        http.get(
          `${HCC_API_BASE_URL}/proxy/resource-types/openshift-clusters/`,
          () => {
            hitBrokenProxyPath = true;
            return HttpResponse.json(
              {
                errors: [
                  {
                    status: 404,
                    detail: 'Undefined Insights application',
                  },
                ],
              },
              { status: 404 },
            );
          },
        ),
        http.get(
          `${HCC_API_BASE_URL}/cost-management/v1/resource-types/openshift-clusters/`,
          () => {
            hitDirectPath = true;
            return HttpResponse.json({
              data: [{ value: 'uuid-1', cluster_alias: 'demolab' }],
            });
          },
        ),
      );

      await createClient(discoveryApi).searchOpenShiftClusters('', {
        token: 'sso-token',
      });

      expect(hitBrokenProxyPath).toBe(false);
      expect(hitDirectPath).toBe(true);
    });
  });
});
