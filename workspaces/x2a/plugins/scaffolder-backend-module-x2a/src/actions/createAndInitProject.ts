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
import {
  DefaultApiClient,
  Project,
  ProjectsPost,
  ProjectsProjectIdRunPost200Response,
  normalizeRepoUrl,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import type { ActionLogger } from './createProjectAction';

export type CreateAndInitProjectParams = {
  api: DefaultApiClient;
  row: ProjectsPost['body'];
  sourceRepoToken: string;
  targetRepoToken: string;
  userPrompt?: string;
  backstageToken?: string;
  hostProviderMap: Map<string, ScmProviderName>;
  logger: ActionLogger;
};

export const createAndInitProject = async (
  params: CreateAndInitProjectParams,
): Promise<{ projectId: string; initJobId: string }> => {
  const {
    api,
    row,
    sourceRepoToken,
    targetRepoToken,
    userPrompt,
    backstageToken: token,
    logger,
  } = params;

  const body: ProjectsPost['body'] = {
    name: row.name,
    description: row.description ?? '',
    abbreviation: row.abbreviation,
    ownedByGroup: row.ownedByGroup?.trim() || undefined,
    sourceRepoUrl: normalizeRepoUrl(row.sourceRepoUrl),
    targetRepoUrl: normalizeRepoUrl(row.targetRepoUrl),
    sourceRepoBranch: row.sourceRepoBranch,
    targetRepoBranch: row.targetRepoBranch,
  };

  logger.info(`Creating project "${row.name}" (${JSON.stringify(body)})`);

  let project: Project;
  try {
    const response = await api.projectsPost({ body }, { token });
    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      logger.error(
        `Project "${row.name}" creation failed (status ${response.status}): ${JSON.stringify(error)}`,
      );
      throw new Error(error?.message ?? JSON.stringify(error));
    }
    project = await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating project "${row.name}": ${message}`);
    throw error;
  }

  logger.info(
    `Project "${row.name}" created with id ${project.id}, triggering init-phase`,
  );

  let initResponseData: ProjectsProjectIdRunPost200Response;
  try {
    const initResponse = await api.projectsProjectIdRunPost(
      {
        path: { projectId: project.id },
        body: {
          sourceRepoAuth: { token: sourceRepoToken },
          targetRepoAuth: { token: targetRepoToken },
          userPrompt,
        },
      },
      { token },
    );

    if (!initResponse.ok) {
      const error = (await initResponse.json()) as { message?: string };
      logger.error(
        `Init-phase for project "${row.name}" (${project.id}) failed (status ${initResponse.status}): ${JSON.stringify(error)}`,
      );
      throw new Error(error?.message ?? JSON.stringify(error));
    }

    initResponseData = await initResponse.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      `Error triggering init-phase for project "${row.name}" (${project.id}): ${message}`,
    );

    // if the init fails, let's keep the project created. The user can then list, update and retrigger it manually.
    throw error;
  }

  logger.info(
    `Init-phase triggered for project "${row.name}" (${project.id}), jobId: ${initResponseData.jobId}`,
  );

  return { projectId: project.id, initJobId: initResponseData.jobId };
};
