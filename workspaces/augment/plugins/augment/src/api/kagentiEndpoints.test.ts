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

import type { KagentiApiDeps } from './kagentiEndpoints';
import {
  getHealth,
  getFeatureFlags,
  getDashboards,
  listNamespaces,
  listAgents,
  getAgent,
  createAgent,
  deleteAgent,
  getAgentRouteStatus,
  listMigratableAgents,
  migrateAgent,
  listBuildStrategies,
  getAgentBuildInfo,
  triggerAgentBuild,
  finalizeAgentBuild,
  parseEnv,
  fetchEnvUrl,
  listTools,
  getTool,
  createTool,
  deleteTool,
  getToolRouteStatus,
  getToolBuildInfo,
  triggerToolBuild,
  finalizeToolBuild,
  connectTool,
  invokeTool,
  listShipwrightBuilds,
} from './kagentiEndpoints';

function createDeps(): KagentiApiDeps {
  return {
    fetchJson: jest.fn().mockResolvedValue({}),
  };
}

describe('kagentiEndpoints', () => {
  describe('Health & Config', () => {
    it('getHealth calls /kagenti/health', async () => {
      const deps = createDeps();
      await getHealth(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/health');
    });

    it('getFeatureFlags calls /kagenti/config/features', async () => {
      const deps = createDeps();
      await getFeatureFlags(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/config/features');
    });

    it('getDashboards calls /kagenti/config/dashboards', async () => {
      const deps = createDeps();
      await getDashboards(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/config/dashboards');
    });
  });

  describe('Namespaces', () => {
    it('listNamespaces defaults to enabled_only=true', async () => {
      const deps = createDeps();
      await listNamespaces(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/namespaces?enabled_only=true',
      );
    });

    it('listNamespaces with enabledOnly=false omits query param', async () => {
      const deps = createDeps();
      await listNamespaces(deps, false);
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/namespaces');
    });
  });

  describe('Agents', () => {
    it('listAgents with namespace includes query param', async () => {
      const deps = createDeps();
      await listAgents(deps, 'team1');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents?namespace=team1',
      );
    });

    it('listAgents without namespace omits query param', async () => {
      const deps = createDeps();
      await listAgents(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/agents');
    });

    it('getAgent encodes namespace and name', async () => {
      const deps = createDeps();
      await getAgent(deps, 'my ns', 'my agent');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/my%20ns/my%20agent',
      );
    });

    it('createAgent sends POST with body', async () => {
      const deps = createDeps();
      const body = { name: 'bot', namespace: 'ns1', containerImage: 'img:v1' };
      await createAgent(deps, body as any);
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deleteAgent sends DELETE', async () => {
      const deps = createDeps();
      await deleteAgent(deps, 'ns1', 'bot');
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/agents/ns1/bot', {
        method: 'DELETE',
      });
    });

    it('getAgentRouteStatus calls correct path', async () => {
      const deps = createDeps();
      await getAgentRouteStatus(deps, 'ns1', 'bot');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/ns1/bot/route-status',
      );
    });
  });

  describe('Agent Migration', () => {
    it('listMigratableAgents calls correct path', async () => {
      const deps = createDeps();
      await listMigratableAgents(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/migration/migratable',
      );
    });

    it('migrateAgent sends POST with delete_old', async () => {
      const deps = createDeps();
      await migrateAgent(deps, 'ns1', 'bot', true);
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/ns1/bot/migrate',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('Agent Builds', () => {
    it('listBuildStrategies calls correct path', async () => {
      const deps = createDeps();
      await listBuildStrategies(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/build-strategies',
      );
    });

    it('getAgentBuildInfo calls correct path', async () => {
      const deps = createDeps();
      await getAgentBuildInfo(deps, 'ns1', 'bot');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/ns1/bot/build-info',
      );
    });

    it('triggerAgentBuild sends POST', async () => {
      const deps = createDeps();
      await triggerAgentBuild(deps, 'ns1', 'bot');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/ns1/bot/buildrun',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('finalizeAgentBuild sends POST', async () => {
      const deps = createDeps();
      await finalizeAgentBuild(deps, 'ns1', 'bot');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/ns1/bot/finalize-build',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('Env Parsing', () => {
    it('parseEnv sends POST with content', async () => {
      const deps = createDeps();
      await parseEnv(deps, 'FOO=bar');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/parse-env',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('fetchEnvUrl sends POST with url', async () => {
      const deps = createDeps();
      await fetchEnvUrl(deps, 'https://example.com/env');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/agents/fetch-env-url',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('Tools', () => {
    it('listTools with namespace includes query param', async () => {
      const deps = createDeps();
      await listTools(deps, 'ns1');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools?namespace=ns1',
      );
    });

    it('getTool calls correct path', async () => {
      const deps = createDeps();
      await getTool(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/tools/ns1/my-tool');
    });

    it('createTool sends POST', async () => {
      const deps = createDeps();
      await createTool(deps, { name: 't1', namespace: 'ns1' } as any);
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deleteTool sends DELETE', async () => {
      const deps = createDeps();
      await deleteTool(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool',
        { method: 'DELETE' },
      );
    });

    it('getToolRouteStatus calls correct path', async () => {
      const deps = createDeps();
      await getToolRouteStatus(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool/route-status',
      );
    });

    it('getToolBuildInfo calls correct path', async () => {
      const deps = createDeps();
      await getToolBuildInfo(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool/build-info',
      );
    });

    it('triggerToolBuild sends POST', async () => {
      const deps = createDeps();
      await triggerToolBuild(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool/buildrun',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('finalizeToolBuild sends POST', async () => {
      const deps = createDeps();
      await finalizeToolBuild(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool/finalize-build',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('connectTool sends POST', async () => {
      const deps = createDeps();
      await connectTool(deps, 'ns1', 'my-tool');
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool/connect',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('invokeTool sends POST with tool_name and arguments', async () => {
      const deps = createDeps();
      await invokeTool(deps, 'ns1', 'my-tool', 'search', { query: 'hi' });
      expect(deps.fetchJson).toHaveBeenCalledWith(
        '/kagenti/tools/ns1/my-tool/invoke',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('Shipwright Builds', () => {
    it('listShipwrightBuilds with namespace', async () => {
      const deps = createDeps();
      await listShipwrightBuilds(deps, { namespace: 'ns1' });
      expect(deps.fetchJson).toHaveBeenCalledWith(
        expect.stringContaining('/kagenti/shipwright/builds'),
      );
    });

    it('listShipwrightBuilds without namespace', async () => {
      const deps = createDeps();
      await listShipwrightBuilds(deps);
      expect(deps.fetchJson).toHaveBeenCalledWith('/kagenti/shipwright/builds');
    });
  });

  describe('error handling', () => {
    it('propagates fetchJson errors', async () => {
      const deps = createDeps();
      (deps.fetchJson as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );
      await expect(getHealth(deps)).rejects.toThrow('Network error');
    });
  });
});
