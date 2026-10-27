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

import { z } from 'zod';
import express from 'express';
import { ConflictError, InputError, NotFoundError } from '@backstage/errors';

import {
  Artifact,
  findMigrationPlanArtifact,
  findModuleMigrationPlanArtifact,
  JobStatus,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import { reconcileJobStatus, useEnforceProjectPermissions } from './common';
import { GitRepositoryResolver } from './GitRepositoryResolver';
import { isSafeRepoRelativePath } from '../services/ScmFileStore';

const repoAuthSchema = z.object({ token: z.string().min(1) });

const readRequestSchema = z.object({
  targetRepoAuth: repoAuthSchema.optional(),
});

const saveRequestSchema = z.object({
  content: z.string(),
  message: z.string().trim().min(1),
  version: z.string().min(1),
  targetRepoAuth: repoAuthSchema.optional(),
});

/** What a scope (project or module plan) contributes to the shared handlers. */
interface PlanTarget {
  project: Project;
  /** Describes the document in messages, e.g. "migration plan". */
  documentLabel: string;
  artifact: Artifact | undefined;
  /** Throws a ConflictError when a job that may rewrite the document is running. */
  assertNoActiveJob: () => Promise<void>;
}

type PlanTargetResolver = (req: express.Request) => Promise<PlanTarget>;

export function registerMigrationPlanRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const {
    httpAuth,
    x2aDatabase,
    kubeService,
    logger,
    config,
    permissionsSvc,
    catalog,
    scmFileStore,
  } = deps;
  const gitRepoResolver = new GitRepositoryResolver(config);

  const assertNoActiveJobs = async (
    jobs: Awaited<ReturnType<typeof x2aDatabase.listJobs>>,
    jobLabel: string,
    documentLabel: string,
  ) => {
    const active = jobs.filter(job => JobStatus.from(job.status).isActive());
    // The stored status may be stale, hence the reconciliation with Kubernetes
    const reconciled = await Promise.all(
      active.map(job =>
        reconcileJobStatus(job, { kubeService, x2aDatabase, logger }),
      ),
    );
    if (reconciled.some(job => JobStatus.from(job.status).isActive())) {
      throw new ConflictError(
        `The ${jobLabel} job is running and may rewrite the ${documentLabel}, so it can not be saved now. ` +
          'Wait for the job to finish or cancel it, then reload the document and apply your changes again.',
      );
    }
  };

  const projectTarget: PlanTargetResolver = async req => {
    const { project } = await useEnforceProjectPermissions({
      req,
      readOnly: false,
      projectId: req.params.projectId,
      // the migration plan artifact is part of the enrichment
      doEnrichment: true,
      x2aDatabase,
      httpAuth,
      permissionsSvc,
      catalog,
    });
    return {
      project,
      documentLabel: 'migration plan',
      artifact: findMigrationPlanArtifact(project),
      assertNoActiveJob: async () =>
        assertNoActiveJobs(
          (
            await x2aDatabase.listJobsForProject({ projectId: project.id })
          ).filter(job => job.phase === 'init'),
          'init',
          'migration plan',
        ),
    };
  };

  const moduleTarget: PlanTargetResolver = async req => {
    const { projectId, moduleId } = req.params;
    const { project } = await useEnforceProjectPermissions({
      req,
      readOnly: false,
      projectId,
      x2aDatabase,
      httpAuth,
      permissionsSvc,
      catalog,
    });
    const module = await x2aDatabase.getModule({
      id: moduleId,
      skipEnrichment: true,
    });
    if (!module) {
      throw new NotFoundError(`Module "${moduleId}" not found.`);
    }
    if (module.projectId !== projectId) {
      throw new NotFoundError(
        `Module "${moduleId}" does not belong to project "${projectId}".`,
      );
    }
    const analyzeJobs = await x2aDatabase.listJobs({
      projectId,
      moduleId,
      phase: 'analyze',
      lastJobOnly: true,
    });
    return {
      project,
      documentLabel: `migration plan of the module "${module.name}"`,
      artifact: findModuleMigrationPlanArtifact({ analyze: analyzeJobs[0] }),
      assertNoActiveJob: () =>
        assertNoActiveJobs(analyzeJobs, 'analyze', 'module migration plan'),
    };
  };

  /** The path comes from the stored artifact, never from the client. */
  const documentPath = (target: PlanTarget): string => {
    if (!target.artifact) {
      throw new NotFoundError(
        `The ${target.documentLabel} does not exist yet. Wait for the analysis to finish or run it first.`,
      );
    }
    const path = target.artifact.value;
    if (!isSafeRepoRelativePath(path)) {
      // Do not echo the stored value back to the client
      logger.warn(
        `Refusing unsafe ${target.documentLabel} path of project ${target.project.id}: ${path}`,
      );
      throw new InputError(
        `The stored location of the ${target.documentLabel} is not a valid repository path. Re-run the analysis to regenerate it.`,
      );
    }
    return path;
  };

  const register = (basePath: string, resolveTarget: PlanTargetResolver) => {
    router.post(`${basePath}/read`, async (req, res) => {
      const endpoint = `POST ${basePath}/read`;
      logger.info(`${endpoint} request received`);

      const parsedBody = readRequestSchema.safeParse(req.body ?? {});
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }

      const target = await resolveTarget(req);
      const path = documentPath(target);
      const repo = gitRepoResolver.resolveTargetOnly({
        project: target.project,
        targetRepoAuth: parsedBody.data.targetRepoAuth,
      });

      const file = await scmFileStore.getFile({
        repoUrl: repo.url,
        branch: repo.branch,
        path,
        token: repo.token,
      });
      return res.json({ content: file.content, version: file.version });
    });

    router.put(basePath, async (req, res) => {
      const endpoint = `PUT ${basePath}`;
      logger.info(`${endpoint} request received`);

      const parsedBody = saveRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const { content, message, version, targetRepoAuth } = parsedBody.data;

      const target = await resolveTarget(req);
      // Before the path lookup: while a job (re)generates the document, its
      // artifact is not available and the user should learn about the job.
      await target.assertNoActiveJob();
      const path = documentPath(target);
      const repo = gitRepoResolver.resolveTargetOnly({
        project: target.project,
        targetRepoAuth,
      });

      const saved = await scmFileStore.putFile({
        repoUrl: repo.url,
        branch: repo.branch,
        path,
        token: repo.token,
        content,
        message,
        expectedVersion: version,
      });
      logger.info(
        `${endpoint}: committed ${path} of project ${target.project.id} to ${repo.branch}`,
      );
      return res.json({ version: saved.version });
    });
  };

  register('/projects/:projectId/migration-plan', projectTarget);
  register(
    '/projects/:projectId/modules/:moduleId/migration-plan',
    moduleTarget,
  );
}
