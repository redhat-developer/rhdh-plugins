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
  Repository,
  ScaffolderTask,
  TaskLocation,
} from '../database/repositoryDao';

export interface RespositoryDto {
  url: string;
  tasks: ScaffolderTaskDto[];
}

export interface ScaffolderTaskDto {
  taskId: string;
  scaffolderOptions: Record<string, any>;
  repositoryId: number;
  locations: string[];
}

export function toRepositoryResponseDto(
  repositories: Repository[],
  tasks: ScaffolderTask[],
  locations: TaskLocation[],
): RespositoryDto[] {
  const repositoriesDto = repositories.map(repo => {
    const repoTasks = tasks
      .filter(task => task.repositoryId === repo.id)
      .map(task => {
        const taskLocations = locations
          .filter(location => location.taskId === task.taskId)
          .map(location => location.location);
        return {
          ...task,
          locations: taskLocations,
        };
      });

    return {
      url: repo.url,
      tasks: repoTasks,
    };
  });

  return repositoriesDto;
}
