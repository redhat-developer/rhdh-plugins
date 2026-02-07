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
import { useEffect } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { useClientService } from './ClientService';

const PLACEHOLDER_REPO_AUTH = { token: 'seed-placeholder' };

/**
 * Seed the database with test data.
 *
 * Never use in production.
 */
export const useSeedTestData = () => {
  const clientService = useClientService();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  useEffect(() => {
    const doItAsync = async () => {
      // Create projects; keep the first project for modules + jobs
      let uiDevProjectId: string | undefined;
      for (let i = 0; i < 2; i++) {
        const res = await clientService.projectsPost({
          body: {
            name: `Test Project ${i}`,
            description: `Test Description ${i}`,
            abbreviation: `TP${i}`,
            sourceRepoUrl: `https://github.com/org/source-repo${i}`,
            targetRepoUrl: `https://github.com/org/target-repo${i}`,
            sourceRepoBranch: `main${i}`,
            targetRepoBranch: `main${i}`,
          },
        });
        const project = await res.json();
        if (i === 0) {
          uiDevProjectId = project.id;
        }
      }

      if (!uiDevProjectId) return;

      // Create 4 modules for the first project (for UI development)
      const moduleIds: string[] = [];
      const moduleSpecs = [
        { name: 'Module A', sourcePath: 'src/module-a' },
        { name: 'Module B', sourcePath: 'src/module-b' },
        { name: 'Module C', sourcePath: 'lib/module-c' },
        { name: 'Module D', sourcePath: 'app/module-d' },
      ];
      for (const spec of moduleSpecs) {
        const modRes = await clientService.projectsProjectIdModulesPost({
          path: { projectId: uiDevProjectId },
          body: { name: spec.name, sourcePath: spec.sourcePath },
        });
        const mod = await modRes.json();
        moduleIds.push(mod.id);
      }

      // Create jobs in various phases via run endpoints (clientService only).
      // Placeholder auth; job records are created before K8s, so we get pending jobs for UI dev.
      let initJobId: string | undefined;
      try {
        const initRes = await clientService.projectsProjectIdRunPost({
          path: { projectId: uiDevProjectId },
          body: {
            sourceRepoAuth: PLACEHOLDER_REPO_AUTH,
            targetRepoAuth: PLACEHOLDER_REPO_AUTH,
          },
        });
        const initData = await initRes.json();
        if (initData?.jobId) initJobId = initData.jobId;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Init run failed', error);
      }

      // eslint-disable-next-line no-console
      console.log(
        `Running analyze, migrate, publish for modules, after init job ${initJobId}`,
      );
      for (let i = 0; i < moduleIds.length; i++) {
        let phases: Array<'analyze' | 'migrate' | 'publish'> = [];
        if (i === 0) {
          phases = ['analyze', 'migrate', 'publish'];
        } else if (i === 1) {
          phases = ['analyze', 'migrate'];
        } else if (i === 2) {
          phases = ['analyze'];
        }

        for (const phase of phases) {
          try {
            await clientService.projectsProjectIdModulesModuleIdRunPost({
              path: { projectId: uiDevProjectId, moduleId: moduleIds[i] },
              body: {
                phase,
                sourceRepoAuth: PLACEHOLDER_REPO_AUTH,
                targetRepoAuth: PLACEHOLDER_REPO_AUTH,
              },
            });
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              `Run failed for module ${moduleIds[i]} in phase ${phase}`,
              error,
            );
          }
        }
      }

      window.location.reload();
    };
    doItAsync();
  }, [clientService, discoveryApi, fetchApi]);
};
