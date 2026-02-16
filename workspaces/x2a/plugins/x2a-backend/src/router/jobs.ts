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

import express from 'express';
import { InputError, NotFoundError } from '@backstage/errors';
import { ModulePhase } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import { isUserOfAdminViewPermission } from './common';

export function registerJobRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const { httpAuth, x2aDatabase, kubeService, logger, permissionsSvc } = deps;

  // TODO: Add /projects/:projectId/log

  router.get('/projects/:projectId/modules/:moduleId/log', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/modules/:moduleId/log';
    const { projectId, moduleId } = req.params;
    const streaming = req.query.streaming === 'true';
    const phase = req.query.phase as ModulePhase;

    // Validate phase parameter (required)
    if (!phase || !['analyze', 'migrate', 'publish'].includes(phase)) {
      throw new InputError(
        'phase query parameter is required and must be one of: analyze, migrate, publish',
      );
    }

    logger.info(
      `${endpoint} request: projectId=${projectId}, moduleId=${moduleId}, streaming=${streaming}, phase=${phase}`,
    );

    // Get credentials and permissions
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const canViewAll = await isUserOfAdminViewPermission(
      req as unknown as express.Request,
      permissionsSvc,
      httpAuth,
    );

    // Verify project exists and user has access
    const project = await x2aDatabase.getProject(
      { projectId },
      { credentials, canViewAll },
    );
    if (!project) {
      throw new NotFoundError(`Project not found`);
    }

    // Verify module exists
    const module = await x2aDatabase.getModule({
      id: moduleId,
      skipEnrichment: true,
    });
    if (!module) {
      throw new NotFoundError(`Module not found`);
    }

    // Verify module belongs to project
    if (module.projectId !== projectId) {
      throw new NotFoundError(`Module does not belong to project`);
    }

    // Get latest job for module filtered by requested phase
    const jobs = await x2aDatabase.listJobs({
      projectId,
      moduleId,
      phase,
      lastJobOnly: true,
    });

    if (jobs.length === 0) {
      throw new NotFoundError(`No jobs found for module with phase '${phase}'`);
    }

    const latestJob = jobs[0]; // Already sorted by started_at DESC in listJobs

    // If job is finished, return logs from database
    if (latestJob.status === 'success' || latestJob.status === 'error') {
      logger.info(
        `Job ${latestJob.id} is finished (status: ${latestJob.status}), returning logs from database`,
      );
      res.setHeader('Content-Type', 'text/plain');
      const log = await x2aDatabase.getJobLogs({ jobId: latestJob.id });
      if (!log) {
        logger.error(`Log not found for a finished job ${latestJob.id}`);
      }
      res.send(log || '');
      return;
    }

    // Check if job has k8sJobName
    if (!latestJob.k8sJobName) {
      logger.warn(
        `Job ${latestJob.id} has no k8sJobName, returning empty logs`,
      );
      res.setHeader('Content-Type', 'text/plain');
      res.send('');
      return;
    }

    // Get logs from Kubernetes
    const logs = await kubeService.getJobLogs(latestJob.k8sJobName, streaming);

    // Set content type
    res.setHeader('Content-Type', 'text/plain');

    // Handle streaming vs non-streaming
    if (streaming && typeof logs !== 'string') {
      logs.pipe(res);
    } else {
      res.send(logs as string);
    }
  });
}
