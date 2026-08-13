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
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createConditionTransformer } from '@backstage/plugin-permission-node';

import { orchestratorPermissions } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import {
  WorkflowLogProvider,
  workflowLogsExtensionEndpoint,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';

import { createOrchestratorActions } from './actions';
import { WorkflowLogsProvidersRegistry } from './providers/WorkflowLogsProvidersRegistry';
import { createRouter } from './routerWrapper';
import { initPublicServices } from './service/initPublicServices';
import {
  fetchWorkflowResources,
  orchestratorPermissionRules,
  orchestratorWorkflowResourceRef,
} from './service/permission-rules';

/**
 * @public
 * Orchestrator Backend Plugin
 */
export const orchestratorPlugin = createBackendPlugin({
  pluginId: 'orchestrator',
  register(env) {
    const workflowLogsProvidersRegistry = new WorkflowLogsProvidersRegistry();

    env.registerExtensionPoint(workflowLogsExtensionEndpoint, {
      addWorkflowLogProvider(
        ...newWorkflowLogProviders: WorkflowLogProvider[]
      ) {
        newWorkflowLogProviders.forEach(workflowLogProvider => {
          workflowLogsProvidersRegistry.register(workflowLogProvider);
        });
      },
    });
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auditor: coreServices.auditor,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        urlReader: coreServices.urlReader,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
        scheduler: coreServices.scheduler,
        httpAuth: coreServices.httpAuth,
        http: coreServices.httpRouter,
        userInfo: coreServices.userInfo,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init(props) {
        const {
          http,
          permissionsRegistry,
          actionsRegistry,
          permissions,
          userInfo,
        } = props;

        const publicServices = initPublicServices(
          props.logger,
          props.config,
          props.scheduler,
          workflowLogsProvidersRegistry,
        );

        permissionsRegistry.addResourceType({
          resourceRef: orchestratorWorkflowResourceRef,
          getResources: resourceRefs =>
            fetchWorkflowResources(
              publicServices.orchestratorService,
              resourceRefs,
            ),
          permissions: orchestratorPermissions,
          rules: orchestratorPermissionRules,
        });

        // Constructed once and shared by both the HTTP router
        // (`createRouter` below) and the MCP actions, mirroring
        // `service/router.ts`'s own construction from the same ruleset.
        const conditionTransformer = createConditionTransformer(
          permissionsRegistry.getPermissionRuleset(
            orchestratorWorkflowResourceRef,
          ),
        );

        createOrchestratorActions({
          actionsRegistry,
          permissions,
          userInfo,
          orchestratorService: publicServices.orchestratorService,
          conditionTransformer,
          logger: props.logger,
        });

        const router = await createRouter({
          ...props,
          workflowLogsProvidersRegistry,
          publicServices,
        });
        http.use(router);
        http.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        http.addAuthPolicy({
          path: '/static',
          allow: 'unauthenticated',
        });
        http.addAuthPolicy({
          path: '/docs',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
