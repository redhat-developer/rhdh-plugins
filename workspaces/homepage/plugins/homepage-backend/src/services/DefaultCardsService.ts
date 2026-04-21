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
  BackstageCredentials,
  BackstageUserPrincipal,
  LoggerService,
  PermissionsService,
  RootConfigService,
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { buildUserContext } from '../defaultCards/buildUserContext';
import { filterToVisibleLeaves } from '../defaultCards/evaluateVisibility';
import {
  collectReferencedPermissions,
  loadCustomizable,
  loadDefaultCards,
} from '../defaultCards/loadDefaultCards';
import { CardNode, DefaultCardsResponse } from '../defaultCards/types';

export interface DefaultCardsService {
  getDefaultCards(options: {
    credentials: BackstageCredentials<BackstageUserPrincipal>;
  }): Promise<DefaultCardsResponse>;
}

export class DefaultCardsServiceImpl implements DefaultCardsService {
  readonly #tree: CardNode[];
  readonly #customizable: boolean;
  readonly #referencedPermissions: Set<string>;
  readonly #catalog: typeof catalogServiceRef.T;
  readonly #permissions: PermissionsService;
  readonly #logger: LoggerService;

  static create(options: {
    config: RootConfigService;
    catalog: typeof catalogServiceRef.T;
    permissions: PermissionsService;
    logger: LoggerService;
  }): DefaultCardsServiceImpl {
    const tree = loadDefaultCards(options.config);
    const customizable = loadCustomizable(options.config);
    const referencedPermissions = collectReferencedPermissions(tree);
    options.logger.info(
      `Loaded ${tree.length} default homepage card root node(s) referencing ${referencedPermissions.size} permission(s), customizable=${customizable}`,
    );
    return new DefaultCardsServiceImpl(
      tree,
      customizable,
      referencedPermissions,
      options.catalog,
      options.permissions,
      options.logger,
    );
  }

  private constructor(
    tree: CardNode[],
    customizable: boolean,
    referencedPermissions: Set<string>,
    catalog: typeof catalogServiceRef.T,
    permissions: PermissionsService,
    logger: LoggerService,
  ) {
    this.#tree = tree;
    this.#customizable = customizable;
    this.#referencedPermissions = referencedPermissions;
    this.#catalog = catalog;
    this.#permissions = permissions;
    this.#logger = logger;
  }

  async getDefaultCards({
    credentials,
  }: {
    credentials: BackstageCredentials<BackstageUserPrincipal>;
  }): Promise<DefaultCardsResponse> {
    const ctx = await buildUserContext({
      credentials,
      catalog: this.#catalog,
      permissions: this.#permissions,
      referencedPermissions: this.#referencedPermissions,
      logger: this.#logger,
    });
    return {
      customizable: this.#customizable,
      items: filterToVisibleLeaves(this.#tree, ctx),
    };
  }
}

export const defaultCardsServiceRef = createServiceRef<DefaultCardsService>({
  id: 'homepage.defaultCards',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        config: coreServices.rootConfig,
        catalog: catalogServiceRef,
        permissions: coreServices.permissions,
        logger: coreServices.logger,
      },
      async factory(deps) {
        return DefaultCardsServiceImpl.create(deps);
      },
    }),
});
