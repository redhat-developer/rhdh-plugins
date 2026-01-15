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

import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  AuditorService,
  AuditorServiceEvent,
  HttpAuthService,
  LoggerService,
  PermissionsService,
  SchedulerService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  AuthorizePermissionRequest,
  AuthorizePermissionResponse,
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import type { JsonObject } from '@backstage/types';

import { UnauthorizedError } from '@backstage-community/plugin-rbac-common';
import { fullFormats } from 'ajv-formats/dist/formats';
import express, { Router } from 'express';
import { Request as HttpRequest } from 'express-serve-static-core';
import { OpenAPIBackend, Request } from 'openapi-backend';

import {
  FieldFilter,
  Filter,
  NestedFilter,
  openApiDocument,
  orchestratorInstanceAdminViewPermission,
  orchestratorPermissions,
  orchestratorWorkflowPermission,
  orchestratorWorkflowSpecificPermission,
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
  WorkflowOverviewListResultDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowLogsProvidersRegistry } from '../providers/WorkflowLogsProvidersRegistry';
import { RouterOptions } from '../routerWrapper';
import { buildPagination } from '../types/pagination';
import { V2 } from './api/v2';
import { DataIndexService } from './DataIndexService';
import { DataInputSchemaService } from './DataInputSchemaService';
import { OrchestratorService } from './OrchestratorService';
import { SonataFlowService } from './SonataFlowService';
import { WorkflowCacheService } from './WorkflowCacheService';

interface PublicServices {
  dataInputSchemaService: DataInputSchemaService;
  orchestratorService: OrchestratorService;
}

interface RouterApi {
  openApiBackend: OpenAPIBackend;
  v2: V2;
}

const authorize = async (
  request: HttpRequest,
  anyOfPermissions: BasicPermission[],
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<AuthorizePermissionResponse> => {
  const credentials = await httpAuth.credentials(request);
  const decisionResponses: AuthorizePermissionResponse[][] = await Promise.all(
    anyOfPermissions.map(permission =>
      permissionsSvc.authorize([{ permission }], {
        credentials,
      }),
    ),
  );
  const decisions: AuthorizePermissionResponse[] = decisionResponses.map(
    d => d[0],
  );

  const allow = decisions.find(d => d.result === AuthorizeResult.ALLOW);
  return (
    allow || {
      result: AuthorizeResult.DENY,
    }
  );
};

const isUserAuthorizedForInstanceAdminViewPermission = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<boolean> => {
  const credentials = await httpAuth.credentials(request);
  const [decision] = await permissionsSvc.authorize(
    [{ permission: orchestratorInstanceAdminViewPermission }],
    { credentials },
  );

  return decision.result === AuthorizeResult.ALLOW;
};

const filterAuthorizedWorkflowIds = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
  workflowIds: string[],
): Promise<string[]> => {
  const credentials = await httpAuth.credentials(request);
  const genericWorkflowPermissionDecision = await permissionsSvc.authorize(
    [{ permission: orchestratorWorkflowPermission }],
    {
      credentials,
    },
  );

  if (genericWorkflowPermissionDecision[0].result === AuthorizeResult.ALLOW) {
    // The user can see all workflows
    return workflowIds;
  }

  const specificWorkflowRequests: AuthorizePermissionRequest[] =
    workflowIds.map(workflowId => ({
      permission: orchestratorWorkflowSpecificPermission(workflowId),
    }));

  const decisions = await permissionsSvc.authorize(specificWorkflowRequests, {
    credentials,
  });

  return workflowIds.filter(
    (_, idx) => decisions[idx].result === AuthorizeResult.ALLOW,
  );
};

const filterAuthorizedWorkflows = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
  workflows: WorkflowOverviewListResultDTO,
): Promise<WorkflowOverviewListResultDTO> => {
  if (!workflows.overviews) {
    return workflows;
  }

  const authorizedWorkflowIds = await filterAuthorizedWorkflowIds(
    request,
    permissionsSvc,
    httpAuth,
    workflows.overviews.map(w => w.workflowId),
  );

  const filtered = {
    ...workflows,
    overviews: workflows.overviews.filter(w =>
      authorizedWorkflowIds.includes(w.workflowId),
    ),
  };

  return filtered;
};

export async function createBackendRouter(
  options: RouterOptions,
): Promise<Router> {
  const {
    config,
    logger,
    auditor,
    scheduler,
    permissions,
    httpAuth,
    userInfo,
    workflowLogsProvidersRegistry,
  } = options;
  const publicServices = initPublicServices(
    logger,
    config,
    scheduler,
    workflowLogsProvidersRegistry,
  );

  const routerApi = await initRouterApi(publicServices.orchestratorService);

  const router = Router();
  const permissionsIntegrationRouter = createPermissionIntegrationRouter({
    permissions: orchestratorPermissions,
  });
  router.use(express.json());
  router.use(permissionsIntegrationRouter);
  router.use('/workflows', express.text());
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  setupInternalRoutes(
    publicServices,
    routerApi,
    permissions,
    httpAuth,
    auditor,
    userInfo,
  );

  router.use((req, res, next) => {
    if (!next) {
      throw new Error('next is undefined');
    }

    return routerApi.openApiBackend
      .handleRequest(req as Request, req, res, next)
      .catch(error => {
        auditor
          .createEvent({
            eventId: 'generic-error-handler',
            request: req,
            // Keep at high since this is a fallback - any error should be caught in handlers
            severityLevel: 'high',
            meta: {},
          })
          .then(event => {
            event.fail({
              meta: {},
              error,
            });
          });

        next(error);
      });
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error({ logAllErrors: true })); // log also openapi errors

  return router;
}

function initPublicServices(
  logger: LoggerService,
  config: Config,
  scheduler: SchedulerService,
  workflowLogsProvidersRegistry: WorkflowLogsProvidersRegistry,
): PublicServices {
  const dataIndexUrl = config.getString('orchestrator.dataIndexService.url');
  const dataIndexService = new DataIndexService(dataIndexUrl, logger);
  const sonataFlowService = new SonataFlowService(dataIndexService, logger);

  const workflowCacheService = new WorkflowCacheService(
    logger,
    dataIndexService,
    sonataFlowService,
  );
  workflowCacheService.schedule({ scheduler: scheduler });

  // All the workflow logging related stuff should be moved to their respective backend module
  // Probablt define that WorkflowLoggerService Class/type in the common or perhaps that -node package
  // Get the orchestrator logging config
  // Create that workflow logging class/interface instance here
  const isWorkflowLogProviderAdded = config.getOptional(
    'orchestrator.workflowLogProvider',
  );
  let workflowLogProvider;
  if (isWorkflowLogProviderAdded) {
    workflowLogProvider = workflowLogsProvidersRegistry.getProvider('loki');
  }

  const orchestratorService = new OrchestratorService(
    sonataFlowService,
    dataIndexService,
    workflowCacheService,
    workflowLogProvider,
  );

  const dataInputSchemaService = new DataInputSchemaService();

  return {
    orchestratorService,
    dataInputSchemaService,
  };
}

async function initRouterApi(
  orchestratorService: OrchestratorService,
): Promise<RouterApi> {
  const openApiBackend = new OpenAPIBackend({
    definition: openApiDocument,
    strict: false,
    ajvOpts: {
      strict: false,
      strictSchema: false,
      verbose: true,
      addUsedSchema: false,
      formats: fullFormats, // open issue: https://github.com/openapistack/openapi-backend/issues/280
    },
    handlers: {
      validationFail: async (
        c,
        _req: express.Request,
        res: express.Response,
      ) => {
        console.log('OPENAPI validationFail', c.operation);
        res.status(400).json({ err: c.validation.errors });
      },
      notFound: async (_c, req: express.Request, res: express.Response) => {
        res.status(404).json({ err: `${req.path} path not found` });
      },
      notImplemented: async (_c, req: express.Request, res: express.Response) =>
        res.status(500).json({ err: `${req.path} not implemented` }),
    },
  });
  await openApiBackend.init();
  const v2 = new V2(orchestratorService);
  return { v2, openApiBackend };
}

// ======================================================
// Internal Backstage API calls to delegate to SonataFlow
// ======================================================
function setupInternalRoutes(
  services: PublicServices,
  routerApi: RouterApi,
  permissions: PermissionsService,
  httpAuth: HttpAuthService,
  auditor: AuditorService,
  userInfo: UserInfoService,
) {
  function manageDenyAuthorization(auditEvent: AuditorServiceEvent) {
    const error = new UnauthorizedError();
    auditEvent.fail({
      meta: {
        message: 'Not authorized to request the endpoint',
      },
      error: new UnauthorizedError(),
    });

    throw error;
  }
  // v2
  routerApi.openApiBackend.register(
    'getWorkflowsOverviewForEntity',
    async (_c, req, res: express.Response, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-overview-entity',
        request: req,
      });
      const targetEntity = req.body.targetEntity as string;
      const annotationWorkflowIds = req.body.annotationWorkflowIds as string[];
      try {
        const result = await routerApi.v2.getWorkflowsOverviewForEntity(
          targetEntity,
          annotationWorkflowIds,
        );

        const workflows = await filterAuthorizedWorkflows(
          req,
          permissions,
          httpAuth,
          result,
        );
        auditEvent.success({
          meta: {
            workflowsCount: workflows.overviews?.length,
          },
        });
        res.json(workflows);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowsOverview',
    async (_c, req, res: express.Response, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-overview',
        request: req,
      });

      try {
        const result = await routerApi.v2.getWorkflowsOverview(
          buildPagination(req),
          getRequestFilters(req),
        );

        const workflows = await filterAuthorizedWorkflows(
          req,
          permissions,
          httpAuth,
          result,
        );
        auditEvent.success({
          meta: {
            workflowsCount: workflows.overviews?.length,
          },
        });
        res.json(workflows);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowSourceById',
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-source',
        request: req,
        meta: {
          actionType: 'by-id',
          workflowId,
        },
      });

      const decision = await authorize(
        req,
        [
          orchestratorWorkflowPermission,
          orchestratorWorkflowSpecificPermission(workflowId),
        ],
        permissions,
        httpAuth,
      );
      if (decision.result === AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }

      try {
        const result = await routerApi.v2.getWorkflowSourceById(workflowId);
        auditEvent.success();
        res.status(200).contentType('text/plain').send(result);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'executeWorkflow',
    async (c, req: express.Request, res: express.Response, next) => {
      const workflowId = c.request.params.workflowId as string;
      const credentials = await httpAuth.credentials(req);
      const token = req.headers.authorization?.split(' ')[1];
      const initiatorEntity = await (
        await userInfo.getUserInfo(credentials)
      ).userEntityRef;

      const auditEvent = await auditor.createEvent({
        eventId: 'execute-workflow',
        request: req,
        meta: {
          workflowId,
        },
      });

      const decision = await authorize(
        req,
        [
          orchestratorWorkflowUsePermission,
          orchestratorWorkflowUseSpecificPermission(workflowId),
        ],
        permissions,
        httpAuth,
      );
      if (decision.result === AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }

      const executeWorkflowRequestDTO = req.body;

      return routerApi.v2
        .executeWorkflow(
          executeWorkflowRequestDTO,
          workflowId,
          initiatorEntity,
          token,
        )
        .then(result => {
          auditEvent.success({ meta: { id: result.id } });
          return res.status(200).json(result);
        })
        .catch(error => {
          auditEvent.fail({ error });
          next(error);
        });
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'retriggerInstance',
    async (c, req: express.Request, res: express.Response, next) => {
      const workflowId = c.request.params.workflowId as string;
      const instanceId = c.request.params.instanceId as string;
      const token = req.headers.authorization?.split(' ')[1];
      const retriggerInstanceRequestDTO = req.body;

      const auditEvent = await auditor.createEvent({
        eventId: 'retrigger-instance',
        request: req,
        meta: {
          workflowId,
          instanceId,
        },
      });

      const decision = await authorize(
        req,
        [
          orchestratorWorkflowUsePermission,
          orchestratorWorkflowUseSpecificPermission(workflowId),
        ],
        permissions,
        httpAuth,
      );
      if (decision.result === AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }

      await routerApi.v2
        .retriggerInstance(
          workflowId,
          instanceId,
          retriggerInstanceRequestDTO,
          token,
        )
        .then(result => {
          auditEvent.success();
          return res.status(200).json(result);
        })
        .catch(error => {
          auditEvent.fail({ error });
          next(error);
        });
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowOverviewById',
    async (c, req: express.Request, res: express.Response, next) => {
      const workflowId = c.request.params.workflowId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-overview',
        request: req,
        meta: {
          actionType: 'by-id',
          workflowId,
        },
      });

      const decision = await authorize(
        req,
        [
          orchestratorWorkflowPermission,
          orchestratorWorkflowSpecificPermission(workflowId),
        ],
        permissions,
        httpAuth,
      );
      if (decision.result === AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }

      return routerApi.v2
        .getWorkflowOverviewById(workflowId)
        .then(result => {
          auditEvent.success({
            meta: {
              workflowId: result.workflowId,
            },
          });
          return res.json(result);
        })
        .catch(error => {
          auditEvent.fail({ error });
          next(error);
        });
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowStatuses',
    async (_c, request: express.Request, res: express.Response, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-statuses',
        request,
      });

      // Anyone is authorized to call this endpoint

      return routerApi.v2
        .getWorkflowStatuses()
        .then(result => {
          auditEvent.success();
          res.status(200).json(result);
        })
        .catch(error => {
          auditEvent.fail({ error });
          next(error);
        });
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowInputSchemaById',
    async (c, req: express.Request, res: express.Response, next) => {
      const workflowId = c.request.params.workflowId as string;
      const instanceId = c.request.query.instanceId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-input-schema',
        request: req,
        meta: {
          actionType: 'by-id',
          workflowId,
          instanceId,
        },
      });

      try {
        const decision = await authorize(
          req,
          [
            orchestratorWorkflowPermission,
            orchestratorWorkflowSpecificPermission(workflowId),
          ],
          permissions,
          httpAuth,
        );
        if (decision.result === AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }

        const workflowDefinition =
          await services.orchestratorService.fetchWorkflowInfo({
            definitionId: workflowId,
          });

        if (!workflowDefinition) {
          throw new Error(
            `Failed to fetch workflow info for workflow ${workflowId}`,
          );
        }
        const serviceUrl = workflowDefinition.serviceUrl;
        if (!serviceUrl) {
          throw new Error(
            `Service URL is not defined for workflow ${workflowId}`,
          );
        }

        const definition =
          await services.orchestratorService.fetchWorkflowDefinition({
            definitionId: workflowId,
          });

        if (!definition) {
          throw new Error(
            'Failed to fetch workflow definition for workflow ${workflowId}',
          );
        }

        if (!definition.dataInputSchema) {
          res.status(200).json({});
          return;
        }

        const instanceVariables = instanceId
          ? await services.orchestratorService.fetchInstanceVariables({
              instanceId,
            })
          : undefined;

        const workflowData = instanceVariables
          ? services.dataInputSchemaService.extractWorkflowData(
              instanceVariables,
            )
          : undefined;

        const workflowInfo = await routerApi.v2.getWorkflowInputSchemaById(
          workflowId,
          serviceUrl,
        );

        if (!workflowInfo?.inputSchema?.properties) {
          auditEvent.success({
            meta: {
              message: 'Successfully found nothing.',
            },
          });
          res.status(200).json({});
          return;
        }

        const inputSchemaProps = workflowInfo.inputSchema.properties;
        let inputData;

        if (workflowData) {
          inputData = Object.keys(inputSchemaProps)
            .filter(k => k in workflowData)
            .reduce((result, k) => {
              if (workflowData[k] === undefined) {
                return result;
              }
              result[k] = workflowData[k];
              return result;
            }, {} as JsonObject);
        }

        auditEvent.success({
          meta: {
            workflowId: workflowInfo.id,
          },
        });
        res.status(200).json({
          inputSchema: workflowInfo.inputSchema,
          data: inputData,
        });
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowInstances',
    async (c, req: express.Request, res: express.Response, next) => {
      const workflowId = c.request.params.workflowId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'get-workflow-instances',
        request: req,
      });

      const decision = await authorize(
        req,
        [
          orchestratorWorkflowPermission,
          orchestratorWorkflowSpecificPermission(workflowId),
        ],
        permissions,
        httpAuth,
      );
      if (decision.result === AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }

      return routerApi.v2
        .getInstances(buildPagination(req), getRequestFilters(req), [
          workflowId,
        ])
        .then(result => {
          auditEvent.success();
          res.json(result);
        })
        .catch(error => {
          auditEvent.fail({ error });
          next(error);
        });
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'pingWorkflowServiceById',
    async (c, req: express.Request, res: express.Response, next) => {
      const workflowId = c.request.params.workflowId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'ping-workflow-service',
        request: req,
      });

      const decision = await authorize(
        req,
        [
          orchestratorWorkflowPermission,
          orchestratorWorkflowSpecificPermission(workflowId),
        ],
        permissions,
        httpAuth,
      );
      if (decision.result === AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }

      return routerApi.v2
        .pingWorkflowService(workflowId)
        .then(result => {
          auditEvent.success();
          res.json(result);
        })
        .catch(error => {
          auditEvent.fail({ error });
          next(error);
        });
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getInstances',
    async (_c, req: express.Request, res: express.Response, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: 'get-instances',
        request: req,
      });

      try {
        // Once we assign user to the instance in the future, we can rework this filtering
        const allWorkflowIds = routerApi.v2.getWorkflowIds();
        const authorizedWorkflowIds: string[] =
          await filterAuthorizedWorkflowIds(
            req,
            permissions,
            httpAuth,
            allWorkflowIds,
          );

        if (!authorizedWorkflowIds || authorizedWorkflowIds.length === 0)
          res.json([]);

        const credentials = await httpAuth.credentials(req);
        const initiatorEntity = (await userInfo.getUserInfo(credentials))
          .userEntityRef;
        const isUserAuthorizedForInstanceAdminView: boolean = // This permission will let user see ALL instances (including ones others created)
          await isUserAuthorizedForInstanceAdminViewPermission(
            req,
            permissions,
            httpAuth,
          );

        const requestFilters = getRequestFilters(req);

        let filters = requestFilters;

        if (!isUserAuthorizedForInstanceAdminView) {
          const initiatorEntityFilter: FieldFilter = {
            operator: 'EQ',
            value: initiatorEntity,
            field: 'initiatorEntity',
          };

          const nestedVariablesFilter: NestedFilter = {
            field: 'variables',
            nested: initiatorEntityFilter,
          };

          if (requestFilters === undefined) {
            filters = nestedVariablesFilter;
          } else {
            // combine filters
            filters = {
              operator: 'AND',
              filters: [nestedVariablesFilter, requestFilters],
            };
          }
        }

        const result = await routerApi.v2.getInstances(
          buildPagination(req),
          filters,
          authorizedWorkflowIds,
        );

        auditEvent.success({ meta: { authorizedWorkflowIds } });
        res.json(result);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getInstanceById',
    async (c, request: express.Request, res: express.Response, next) => {
      const instanceId = c.request.params.instanceId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'get-instance',
        request,
        meta: {
          actionType: 'by-id',
          instanceId,
        },
      });

      try {
        const instance = await routerApi.v2.getInstanceById(instanceId);

        const workflowId = instance.processId;

        const decision = await authorize(
          request,
          [
            orchestratorWorkflowPermission,
            orchestratorWorkflowSpecificPermission(workflowId),
          ],
          permissions,
          httpAuth,
        );
        if (decision.result === AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }

        const credentials = await httpAuth.credentials(request);
        const initiatorEntity = (await userInfo.getUserInfo(credentials))
          .userEntityRef;
        // Check if user is authorized to view all instances
        const isUserAuthorizedForInstanceAdminView =
          await isUserAuthorizedForInstanceAdminViewPermission(
            request,
            permissions,
            httpAuth,
          );

        // If not an admin, enforce initiatorEntity check
        if (!isUserAuthorizedForInstanceAdminView) {
          const instanceInitiatorEntity = instance.initiatorEntity;
          if (instanceInitiatorEntity !== initiatorEntity) {
            throw new Error(
              `Unauthorized to access instance ${instanceId} not initiated by user.`,
            );
          }
        }

        auditEvent.success();
        res.status(200).json(instance);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'getWorkflowLogById',
    async (c, request: express.Request, res: express.Response, next) => {
      const instanceId = c.request.params.instanceId as string;
      // will probably have to get the raw log at some point
      // const rawLog = c.request.query.instanceId as Boolean;

      const auditEvent = await auditor.createEvent({
        eventId: 'get-logs-by-instance',
        request,
        meta: {
          actionType: 'by-id',
          instanceId,
        },
      });

      try {
        // Check that a log provider has been setup
        if (!services.orchestratorService.hasLogProvider()) {
          throw new Error(`No log provider setup`);
        }
        const instance = await routerApi.v2.getInstanceById(instanceId);
        const workflowId = instance.processId;

        const decision = await authorize(
          request,
          [
            orchestratorWorkflowPermission,
            orchestratorWorkflowSpecificPermission(workflowId),
          ],
          permissions,
          httpAuth,
        );
        if (decision.result === AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }

        const credentials = await httpAuth.credentials(request);
        const initiatorEntity = (await userInfo.getUserInfo(credentials))
          .userEntityRef;
        // Check if user is authorized to view all instances
        const isUserAuthorizedForInstanceAdminView =
          await isUserAuthorizedForInstanceAdminViewPermission(
            request,
            permissions,
            httpAuth,
          );

        // If not an admin, enforce initiatorEntity check
        if (!isUserAuthorizedForInstanceAdminView) {
          const instanceInitiatorEntity = instance.initiatorEntity;
          if (instanceInitiatorEntity !== initiatorEntity) {
            throw new Error(
              `Unauthorized to access instance ${instanceId} not initiated by user.`,
            );
          }
        }

        const logs = await routerApi.v2.getInstanceLogsByInstance(instance);

        auditEvent.success();
        res.status(200).json(logs);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );

  // v2
  routerApi.openApiBackend.register(
    'abortWorkflow',
    async (c, request, res, next) => {
      const instanceId = c.request.params.instanceId as string;

      const auditEvent = await auditor.createEvent({
        eventId: 'abort-workflow',
        request,
        meta: {
          actionType: 'by-id',
          instanceId,
        },
      });

      try {
        const instance = await routerApi.v2.getInstanceById(instanceId);
        const workflowId = instance.processId;

        const decision = await authorize(
          request,
          [
            orchestratorWorkflowUsePermission,
            orchestratorWorkflowUseSpecificPermission(workflowId),
          ],
          permissions,
          httpAuth,
        );
        if (decision.result === AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }

        const result = await routerApi.v2.abortWorkflow(workflowId, instanceId);
        auditEvent.success({ meta: { result } });
        res.status(200).json(result);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    },
  );
}

function getRequestFilters(req: HttpRequest): Filter | undefined {
  return req.body.filters ? (req.body.filters as Filter) : undefined;
}
