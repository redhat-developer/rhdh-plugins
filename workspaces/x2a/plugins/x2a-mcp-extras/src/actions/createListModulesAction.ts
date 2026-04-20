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
import { NotFoundError } from '@backstage/errors';
import {
  X2A_ARTIFACT_TYPE_VALUES,
  X2A_JOB_STATUS_VALUES,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { listModulesWithReconciledStatuses } from '@red-hat-developer-hub/backstage-plugin-x2a-node';
import { z as zod } from 'zod';

import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

/** Zod output schema for `x2a-list-modules` */
export function buildListModulesOutputSchema(z: typeof zod) {
  const jobPhaseStatus = z.enum(X2A_JOB_STATUS_VALUES);
  const phaseJob = z
    .object({
      id: z.string().describe('UUID of the job.'),
      projectId: z.string(),
      moduleId: z.string().optional(),
      startedAt: z
        .string()
        .describe('ISO 8601 timestamp when the job started.'),
      finishedAt: z
        .string()
        .optional()
        .describe('ISO 8601 when the job finished, if complete.'),
      phase: z.enum(['init', 'analyze', 'migrate', 'publish']),
      k8sJobName: z.string(),
      status: jobPhaseStatus,
      errorDetails: z.string().optional(),
      commitId: z
        .string()
        .optional()
        .describe(
          'Git commit SHA produced by this job in the target repository, when the phase wrote a commit.',
        ),
      artifacts: z
        .array(
          z.object({
            id: z.string().describe('UUID for the artifact.'),
            type: z
              .enum(X2A_ARTIFACT_TYPE_VALUES)
              .describe(
                'Kind of artifact (e.g. migration plan, migrated sources, Ansible project bundle).',
              ),
            value: z
              .string()
              .describe(
                'Artifact payload (often JSON or file content reference), depending on type.',
              ),
          }),
        )
        .optional()
        .describe(
          'Outputs attached to this phase job: migration plans, generated sources, metadata, or other collected results.',
        ),
    })
    .passthrough()
    .describe('Latest job for this phase on the module, if any.');

  const moduleItem = z
    .object({
      id: z.string().describe('UUID of the module.'),
      name: z.string(),
      sourcePath: z
        .string()
        .describe('Path to the module within the source repository.'),
      projectId: z.string(),
      status: jobPhaseStatus
        .optional()
        .describe('Aggregate module status derived from phase jobs.'),
      errorDetails: z
        .string()
        .optional()
        .describe('Error detail when the module is in an error state.'),
      analyze: phaseJob.optional(),
      migrate: phaseJob.optional(),
      publish: phaseJob.optional(),
      moduleDetailsUrl: z
        .string()
        .describe('Full URL to the module details page in the Backstage UI.'),
    })
    .passthrough()
    .describe(
      'One migration module. Same fields as GET /projects/:projectId/modules JSON plus moduleDetailsUrl.',
    );

  return z.object({
    projectId: z.string(),
    projectName: z.string(),
    projectDetailsUrl: z
      .string()
      .describe(
        'Full URL to the Project Details page in the Backstage UI. Direct the user to open this URL in their browser to see the project details and trigger next phase.',
      ),
    items: z
      .array(moduleItem)
      .describe(
        'Modules for the project with reconciled phase jobs and aggregate status.',
      ),
  });
}

export type ListModulesMcpOutput = zod.infer<
  ReturnType<typeof buildListModulesOutputSchema>
>;

export function createListModulesAction(options: X2aActionsOptions) {
  const {
    actionsRegistry,
    auth,
    catalog,
    config,
    logger,
    permissionsSvc,
    x2aDatabase,
    kubeService,
  } = options;

  actionsRegistry.register({
    name: 'x2a-list-modules',
    title: 'List X2A Project Modules',
    description: `List all migration modules for an X2A project identified by projectId, including aggregate status and last job per phase (analyze, migrate, publish).`,
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    schema: {
      input: z =>
        z.object({
          projectId: z
            .string()
            .describe('UUID of the project whose modules should be listed.'),
        }),
      output: z => buildListModulesOutputSchema(z),
    },
    action: async ({ input, credentials }) => {
      const { projectId } = input;
      logger.info(`MCP tool x2a-list-modules invoked for project ${projectId}`);

      const ctx = await resolveCredentialsContext({
        credentials,
        auth,
        catalog,
        permissionsSvc,
        readOnly: true,
      });

      const project = await x2aDatabase.getProject(
        { projectId, skipEnrichment: true },
        {
          credentials: ctx.credentials,
          canViewAll: ctx.canViewAll,
          groupsOfUser: ctx.groupsOfUser,
        },
      );
      if (!project) {
        throw new NotFoundError(
          `Project not found for the "${ctx.userRef}" user.`,
        );
      }

      const modules = await x2aDatabase.listModules({ projectId });
      await listModulesWithReconciledStatuses(modules, {
        kubeService,
        x2aDatabase,
        logger,
      });

      const appBaseUrl = config.getString('app.baseUrl');
      const serialized = structuredClone(
        modules.map(module => ({
          ...module,
          moduleDetailsUrl: `${appBaseUrl}/x2a/projects/${project.id}/modules/${module.id}`,
        })),
      ) as ListModulesMcpOutput['items'];

      return {
        output: {
          projectId: project.id,
          projectName: project.name,
          projectDetailsUrl: `${appBaseUrl}/x2a/projects/${project.id}`,
          items: serialized,
        },
      };
    },
  });
}
