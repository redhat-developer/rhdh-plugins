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

import crypto from 'node:crypto';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
} from '@backstage/backend-plugin-api';
// import { NotFoundError } from '@backstage/errors';
import {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

// TODO: till the DB is ready
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Mock Migration 1',
    description: 'Mock Description 1',
    abbreviation: 'MP1',
    // sourceRepository: 'https://github.com/org/repo',
    createdBy: 'user1',
    createdAt: new Date('2026-01-20T12:24:56.615Z'),
  },
  {
    id: '2',
    name: 'Mock Migration 2',
    description: 'Mock Description 2',
    abbreviation: 'MP2',
    // sourceRepository: 'https://github.com/org/repo',
    createdBy: 'user2',
    createdAt: new Date('2026-01-20T12:24:56.616Z'),
  },
];
export class ConvertorService {
  readonly #logger: LoggerService;
  // readonly #catalog: typeof catalogServiceRef.T;

  static create(options: {
    logger: LoggerService;
    // catalog: typeof catalogServiceRef.T;
  }) {
    return new ConvertorService(options.logger);
  }

  private constructor(
    logger: LoggerService,
    // catalog: typeof catalogServiceRef.T,
  ) {
    this.#logger = logger;
    // this.#catalog = catalog;
  }

  async createProject(
    input: {
      name: string;
      abbreviation: string;
      description: string;
      // entityRef?: string;
      // TODO: more
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
    },
  ): Promise<Project> {
    /*
    /* TEMPLATE NOTE:
    // A common pattern for Backstage plugins is to pass an entity reference
    // from the frontend to then fetch the entire entity from the catalog in the
    // backend plugin.
    if (input.entityRef) {
      // TEMPLATE NOTE:
      // Cross-plugin communication uses service-to-service authentication. The
      // `AuthService` lets you generate a token that is valid for communication
      // with the target plugin only. You must also provide credentials for the
      // identity that you are making the request on behalf of.
      //
      // If you want to make a request using the plugin backend's own identity,
      // you can access it via the `auth.getOwnServiceCredentials()` method.
      // Beware that this bypasses any user permission checks.
      const entity = await this.#catalog.getEntityByRef(
        input.entityRef,
        options,
      );
      if (!entity) {
        throw new NotFoundError(`No entity found for ref '${input.entityRef}'`);
      }

      // TEMPLATE NOTE:
      // Here you could read any form of data from the entity. A common use case
      // is to read the value of a custom annotation for your plugin. You can
      // read more about how to add custom annotations here:
      // https://backstage.io/docs/features/software-catalog/extending-the-model#adding-a-new-annotation
      //
      // In this example we just use the entity title to decorate the todo item.

      const entityDisplay = entity.metadata.title ?? input.entityRef;
      title = `[${entityDisplay}] ${input.title}`;
    }
    */

    const id = crypto.randomUUID();
    const createdBy = options.credentials.principal.userEntityRef;
    const newProject: Project = {
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      // sourceRepository: 'https://github.com/org/repo',
      createdBy: createdBy,
      createdAt: new Date(),
    };

    // TODO: persist in the DB

    this.#logger.info(`Created new project: ${JSON.stringify(newProject)}`);

    return newProject;
  }

  async listProjects(): Promise<{ projects: Project[]; totalCount: number }> {
    this.#logger.info('listProjects called');
    // TODO: fetch from the DB, sync with k8s, apply pagination
    const totalCount = mockProjects.length;
    return { projects: mockProjects, totalCount };
  }

  async deleteProject({ projectId }: { projectId: string }) {
    this.#logger.info('deleteProject called');
    // TODO: delete from the DB, sync with k8s, apply pagination
  }

  // async getMigration(request: { id: string }): Promise<Migration> {
  //   // TODO: fetch from the DB
  //   const migration = mockMigrations.find(m => m.id === request.id);

  //   if (!migration) {
  //     throw new NotFoundError(`No migration found with id '${request.id}'`);
  //   }
  //   return migration;
  // }
}

export const convertorServiceRef = createServiceRef<Expand<ConvertorService>>({
  id: 'x2a-convertor',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        // catalog: catalogServiceRef,
      },
      async factory(deps) {
        return ConvertorService.create(deps);
      },
    }),
});
