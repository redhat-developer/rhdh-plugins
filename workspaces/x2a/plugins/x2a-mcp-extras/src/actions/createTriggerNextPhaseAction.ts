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
import { InputError, ConflictError, NotFoundError } from '@backstage/errors';
import {
  reconcileJobStatus,
  generateCallbackToken,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';
import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

export function createTriggerNextPhaseAction(options: X2aActionsOptions) {
  const {
    actionsRegistry,
    auth,
    catalog,
    config,
    discovery,
    kubeService,
    logger,
    permissionsSvc,
    x2aDatabase,
  } = options;

  actionsRegistry.register({
    name: 'x2a-trigger-next-phase',
    title: 'Trigger X2A Init / Next Phase',
    attributes: {
      destructive: true,
      readOnly: false,
      idempotent: false,
    },
    description: `Trigger the init (next-phase) action on an X2A migration project.
This creates a Kubernetes job that analyses the source repository and generates a migration plan.
Source and target repository tokens can be provided explicitly or fall back to app-config values.
Returns a ConflictError if an init job is already running for the project.`,
    schema: {
      input: z =>
        z.object({
          projectId: z
            .string()
            .describe('UUID of the project to trigger the run for.'),
          sourceRepoAuthToken: z
            .string()
            .optional()
            .describe(
              'Source repository auth token. Falls back to configured x2a.git.sourceRepo.token.',
            ),
          targetRepoAuthToken: z
            .string()
            .optional()
            .describe(
              'Target repository auth token. Falls back to configured x2a.git.targetRepo.token.',
            ),
          aapCredentials: z
            .object({
              url: z.string(),
              orgName: z.string(),
              oauthToken: z.string().optional(),
              username: z.string().optional(),
              password: z.string().optional(),
            })
            .optional()
            .describe(
              'Ansible Automation Platform credentials. Falls back to app-config x2a.credentials.aap.',
            ),
          userPrompt: z
            .string()
            .optional()
            .describe('Optional prompt/instructions for the migration agent.'),
        }),
      output: z =>
        z.object({
          status: z
            .string()
            .describe('Job status after creation (typically "pending").'),
          jobId: z.string().describe('UUID of the created init job.'),
        }),
    },
    action: async ({ input, credentials }) => {
      const { projectId } = input;
      logger.info(
        `MCP tool x2a-trigger-next-phase invoked for project ${projectId}`,
      );

      const ctx = await resolveCredentialsContext({
        credentials,
        auth,
        catalog,
        permissionsSvc,
        readOnly: false,
      });

      const project = await x2aDatabase.getProject(
        { projectId, skipEnrichment: true },
        {
          credentials: ctx.credentials,
          canViewAll: ctx.canWriteAll || ctx.canViewAll,
          groupsOfUser: ctx.groupsOfUser,
        },
      );
      if (!project) {
        throw new NotFoundError(
          `Project not found for the "${ctx.userRef}" user.`,
        );
      }

      const sourceToken =
        input.sourceRepoAuthToken ??
        config.getOptionalString('x2a.git.sourceRepo.token');
      const targetToken =
        input.targetRepoAuthToken ??
        config.getOptionalString('x2a.git.targetRepo.token');

      if (!sourceToken) {
        throw new InputError(
          'Source repository token is required. Provide it in the request or configure x2a.git.sourceRepo.token.',
        );
      }
      if (!targetToken) {
        throw new InputError(
          'Target repository token is required. Provide it in the request or configure x2a.git.targetRepo.token.',
        );
      }

      const existingJobs = await x2aDatabase.listJobsForProject({ projectId });
      const activeInitJobs = existingJobs.filter(
        job =>
          job.phase === 'init' && ['pending', 'running'].includes(job.status),
      );
      const reconciledInitJobs = await Promise.all(
        activeInitJobs.map(job =>
          reconcileJobStatus(job, { kubeService, x2aDatabase, logger }),
        ),
      );
      const hasActiveInitJob = reconciledInitJobs.some(job =>
        ['pending', 'running'].includes(job.status),
      );

      if (hasActiveInitJob) {
        throw new ConflictError(
          'An init job is already running for this project. ' +
            'Wait for it to complete or cancel it before starting a new one.',
        );
      }

      const callbackToken = generateCallbackToken();
      const job = await x2aDatabase.createJob({
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'pending',
        callbackToken,
      });

      let k8sJobName: string;
      try {
        const baseUrl =
          config.getOptionalString('x2a.callbackBaseUrl') ??
          (await discovery.getBaseUrl('x2a'));
        const callbackUrl = `${baseUrl}/projects/${projectId}/collectArtifacts`;
        ({ k8sJobName } = await kubeService.createJob({
          jobId: job.id,
          projectId,
          projectName: project.name,
          projectAbbrev: project.abbreviation,
          phase: 'init',
          user: ctx.userRef,
          callbackToken,
          callbackUrl,
          sourceRepo: {
            url: project.sourceRepoUrl,
            branch: project.sourceRepoBranch,
            token: sourceToken,
          },
          targetRepo: {
            url: project.targetRepoUrl,
            branch: project.targetRepoBranch,
            token: targetToken,
          },
          aapCredentials: input.aapCredentials,
          userPrompt: input.userPrompt,
        }));

        await x2aDatabase.updateJob({ id: job.id, k8sJobName });
      } catch (err) {
        logger.error(
          `Failed to create/register k8s job for project ${projectId}, marking DB job ${job.id} as error`,
        );
        await x2aDatabase.updateJob({
          id: job.id,
          status: 'error',
          errorDetails: String(err),
        });
        throw err;
      }

      logger.info(
        `Init job created: jobId=${job.id}, k8sJobName=${k8sJobName}`,
      );

      return {
        output: {
          status: 'pending',
          jobId: job.id,
        },
      };
    },
  });
}
