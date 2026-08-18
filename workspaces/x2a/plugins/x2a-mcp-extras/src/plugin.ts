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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import {
  kubeServiceRef,
  x2aDatabaseServiceRef,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';
import { createX2aActions } from './actions';

/**
 * x2aMcpExtrasPlugin backend plugin
 *
 * Exposes x2a project management as MCP tools for AI clients.
 * Supports dual-mode auth: DCR OAuth (user identity) and static tokens (admin fallback).
 *
 * @public
 */
export const x2aMcpExtrasPlugin = createBackendPlugin({
  pluginId: 'x2a-mcp-extras',
  register(env) {
    env.registerInit({
      deps: {
        actionsRegistry: actionsRegistryServiceRef,
        auth: coreServices.auth,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        permissionsSvc: coreServices.permissions,
        x2aDatabase: x2aDatabaseServiceRef,
        kubeService: kubeServiceRef,
      },
      async init({
        actionsRegistry,
        auth,
        catalog,
        config,
        logger,
        permissionsSvc,
        x2aDatabase,
        kubeService,
      }) {
        createX2aActions({
          actionsRegistry,
          auth,
          catalog,
          config,
          logger,
          permissionsSvc,
          x2aDatabase,
          kubeService,
        });
      },
    });
  },
});
