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
import type { Readable } from 'node:stream';
import { InputError, NotFoundError } from '@backstage/errors';
import {
  ModulePhase,
  Job,
  Phase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import { useEnforceProjectPermissions } from './common';

type Response = express.Response;

async function sendJobLogs(
  res: Response,
  job: Job,
  streaming: boolean,
  deps: Pick<RouterDeps, 'x2aDatabase' | 'kubeService' | 'logger'>,
): Promise<void> {
  const { x2aDatabase, kubeService, logger } = deps;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (
    job.status === 'success' ||
    job.status === 'error' ||
    job.status === 'cancelled'
  ) {
    logger.info(
      `Job ${job.id} is finished (status: ${job.status}), returning logs from database`,
    );
    const log = await x2aDatabase.getJobLogs({ jobId: job.id });
    if (!log) {
      logger.error(`Log not found for a finished job ${job.id}`);
    }
    res.send(log || '');
    return;
  }

  if (!job.k8sJobName) {
    logger.warn(`Job ${job.id} has no k8sJobName, returning empty logs`);
    res.send('');
    return;
  }

  const logs = await kubeService.getJobLogs(job.k8sJobName, streaming);
  if (streaming && typeof logs !== 'string') {
    // Hints to proxies (e.g. nginx, OpenShift route) not to buffer the body.
    res.setHeader('Cache-Control', 'no-store, no-transform, must-revalidate');
    res.setHeader('X-Accel-Buffering', 'no');
    const stream = logs as Readable;
    stream.on('error', err => {
      logger.error(
        `Log stream error for job ${job.id} (k8s: ${job.k8sJobName}): ${err.message}`,
      );
      if (!res.writableEnded) {
        res.write('\n\n[Log stream error: connection interrupted]\n');
        res.end();
      }
      stream.destroy();
    });
    res.on('close', () => {
      if (!stream.destroyed) {
        stream.destroy();
      }
    });
    stream.pipe(res);
  } else {
    res.send(logs as string);
  }
}

export function registerJobRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const {
    httpAuth,
    x2aDatabase,
    kubeService,
    logger,
    permissionsSvc,
    catalog,
  } = deps;

  // Log for the init-phase
  router.get('/projects/:projectId/log', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/log';
    const { projectId } = req.params;
    const rawStreaming = req.query.streaming as string | boolean | undefined;
    const streaming = rawStreaming === 'true' || rawStreaming === true;

    logger.info(
      `${endpoint} request: projectId=${projectId}, streaming=${streaming}`,
    );

    // Enforce project permissions
    await useEnforceProjectPermissions({
      req,
      readOnly: true,
      projectId,
      x2aDatabase,
      httpAuth,
      permissionsSvc,
      catalog,
    });

    // Get latest init job
    const jobs = await x2aDatabase.listJobs({
      projectId,
      phase: 'init',
      lastJobOnly: true,
    });

    if (jobs.length === 0) {
      throw new NotFoundError(
        `No init job found for the project projectId=${projectId}`,
      );
    }

    const latestJob = jobs[0]; // Already sorted by started_at DESC in listJobs

    await sendJobLogs(res, latestJob, streaming, {
      x2aDatabase,
      kubeService,
      logger,
    });
  });

  // Logs for the module-specific phases
  router.get('/projects/:projectId/modules/:moduleId/log', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/modules/:moduleId/log';
    const { projectId, moduleId } = req.params;
    const rawStreaming = req.query.streaming as string | boolean | undefined;
    const streaming = rawStreaming === 'true' || rawStreaming === true;
    const phase = req.query.phase as ModulePhase;

    // Validate phase parameter (required)
    if (!phase || !Phase.modulePhaseValues().includes(phase)) {
      throw new InputError(
        'phase query parameter is required and must be one of: analyze, migrate, publish',
      );
    }

    logger.info(
      `${endpoint} request: projectId=${projectId}, moduleId=${moduleId}, streaming=${streaming}, phase=${phase}`,
    );

    // Enforce project permissions
    await useEnforceProjectPermissions({
      req,
      readOnly: true,
      projectId,
      x2aDatabase,
      httpAuth,
      permissionsSvc,
      catalog,
    });

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

    await sendJobLogs(res, latestJob, streaming, {
      x2aDatabase,
      kubeService,
      logger,
    });
  });
}
