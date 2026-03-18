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
import { useCallback } from 'react';

import {
  MAX_CONCURRENT_BULK_RUN,
  Module,
  Project,
  resolveScmProvider,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useClientService } from '../ClientService';
import { useScmHostMap } from './useScmHostMap';
import { useRepoAuthentication } from '../repoAuth';
import { canRunNextPhase, getNextPhase } from '../components/tools';

export type BulkRunResult = {
  total: number;
  succeeded: number;
  failed: number;
};

export const useBulkRun = () => {
  const clientService = useClientService();
  const repoAuth = useRepoAuthentication();
  const hostMap = useScmHostMap();

  const runAllForProject = useCallback(
    async (
      project: Project,
      existingModules?: Module[],
    ): Promise<BulkRunResult> => {
      let modules = existingModules;
      if (!modules) {
        const response = await clientService.projectsProjectIdModulesGet({
          path: { projectId: project.id },
        });
        modules = await response.json();
      }

      const eligible = modules.filter(m => canRunNextPhase(m, project));
      if (eligible.length === 0) {
        return { total: 0, succeeded: 0, failed: 0 };
      }

      const targetRepoAuthToken = (
        await repoAuth.authenticate([
          resolveScmProvider(
            project.targetRepoUrl,
            hostMap,
          ).getAuthTokenDescriptor(false),
        ])
      )[0].token;

      let sourceRepoAuthToken = targetRepoAuthToken;
      if (project.sourceRepoUrl !== project.targetRepoUrl) {
        sourceRepoAuthToken = (
          await repoAuth.authenticate([
            resolveScmProvider(
              project.sourceRepoUrl,
              hostMap,
            ).getAuthTokenDescriptor(true),
          ])
        )[0].token;
      }

      const runModule = async (m: Module) => {
        const nextPhase = getNextPhase(m);
        if (!nextPhase) {
          throw new Error(`No next phase for module ${m.name}`);
        }
        const response =
          await clientService.projectsProjectIdModulesModuleIdRunPost({
            path: { projectId: m.projectId, moduleId: m.id },
            body: {
              phase: nextPhase,
              sourceRepoAuth: { token: sourceRepoAuthToken },
              targetRepoAuth: { token: targetRepoAuthToken },
            },
          });
        const data = await response.json();
        if (!data.jobId) {
          throw new Error(`No jobId returned for module ${m.name}`);
        }
      };

      let succeeded = 0;
      let failed = 0;
      for (let i = 0; i < eligible.length; i += MAX_CONCURRENT_BULK_RUN) {
        const batch = eligible.slice(i, i + MAX_CONCURRENT_BULK_RUN);
        const results = await Promise.allSettled(batch.map(runModule));
        for (const r of results) {
          if (r.status === 'fulfilled') {
            succeeded++;
          } else {
            failed++;
          }
        }
      }

      return { total: eligible.length, succeeded, failed };
    },
    [clientService, repoAuth, hostMap],
  );

  const runAllGlobal = useCallback(
    async (projectFilter?: (p: Project) => boolean): Promise<BulkRunResult> => {
      const pageSize = 100;
      const allProjects: Project[] = [];

      // reuse pagination to iterate over all projects but keeping the chunks small enough
      for (let page = 0; ; page++) {
        const response = await clientService.projectsGet({
          query: { pageSize, page },
        });
        const data = await response.json();
        const items = data.items ?? [];
        allProjects.push(...items);

        if (items.length === 0) break;
        if (typeof data.totalCount === 'number') {
          if (allProjects.length >= data.totalCount) break;
        } else if (items.length < pageSize) {
          break;
        }
      }

      const projects = projectFilter
        ? allProjects.filter(projectFilter)
        : allProjects;

      const combined: BulkRunResult = { total: 0, succeeded: 0, failed: 0 };

      // This fires up to MAX_CONCURRENT_BULK_RUN^2 requests in parallel
      for (let i = 0; i < projects.length; i += MAX_CONCURRENT_BULK_RUN) {
        const batch = projects.slice(i, i + MAX_CONCURRENT_BULK_RUN);
        const results = await Promise.allSettled(
          batch.map(p => runAllForProject(p)),
        );

        for (const r of results) {
          if (r.status === 'fulfilled') {
            combined.total += r.value.total;
            combined.succeeded += r.value.succeeded;
            combined.failed += r.value.failed;
          } else {
            combined.failed++;
          }
        }
      }

      return combined;
    },
    [clientService, runAllForProject],
  );

  return { runAllForProject, runAllGlobal };
};
