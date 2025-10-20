'use strict';

var rootHttpRouter = require('@backstage/backend-defaults/rootHttpRouter');
var pluginPermissionCommon = require('@backstage/plugin-permission-common');
var pluginPermissionNode = require('@backstage/plugin-permission-node');
var pluginRbacCommon = require('@backstage-community/plugin-rbac-common');
var formats = require('ajv-formats/dist/formats');
var express = require('express');
var openapiBackend = require('openapi-backend');
var backstagePluginOrchestratorCommon = require('@redhat/backstage-plugin-orchestrator-common');
var pagination = require('../types/pagination.cjs.js');
var v2 = require('./api/v2.cjs.js');
var DataIndexService = require('./DataIndexService.cjs.js');
var DataInputSchemaService = require('./DataInputSchemaService.cjs.js');
var OrchestratorService = require('./OrchestratorService.cjs.js');
var SonataFlowService = require('./SonataFlowService.cjs.js');
var WorkflowCacheService = require('./WorkflowCacheService.cjs.js');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var express__default = /*#__PURE__*/_interopDefaultCompat(express);

const authorize = async (request, anyOfPermissions, permissionsSvc, httpAuth) => {
  const credentials = await httpAuth.credentials(request);
  const decisionResponses = await Promise.all(
    anyOfPermissions.map(
      (permission) => permissionsSvc.authorize([{ permission }], {
        credentials
      })
    )
  );
  const decisions = decisionResponses.map(
    (d) => d[0]
  );
  const allow = decisions.find((d) => d.result === pluginPermissionCommon.AuthorizeResult.ALLOW);
  return allow || {
    result: pluginPermissionCommon.AuthorizeResult.DENY
  };
};
const isUserAuthorizedForInstanceAdminViewPermission = async (request, permissionsSvc, httpAuth) => {
  const credentials = await httpAuth.credentials(request);
  const [decision] = await permissionsSvc.authorize(
    [{ permission: backstagePluginOrchestratorCommon.orchestratorInstanceAdminViewPermission }],
    { credentials }
  );
  return decision.result === pluginPermissionCommon.AuthorizeResult.ALLOW;
};
const filterAuthorizedWorkflowIds = async (request, permissionsSvc, httpAuth, workflowIds) => {
  const credentials = await httpAuth.credentials(request);
  const genericWorkflowPermissionDecision = await permissionsSvc.authorize(
    [{ permission: backstagePluginOrchestratorCommon.orchestratorWorkflowPermission }],
    {
      credentials
    }
  );
  if (genericWorkflowPermissionDecision[0].result === pluginPermissionCommon.AuthorizeResult.ALLOW) {
    return workflowIds;
  }
  const specificWorkflowRequests = workflowIds.map((workflowId) => ({
    permission: backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
  }));
  const decisions = await permissionsSvc.authorize(specificWorkflowRequests, {
    credentials
  });
  return workflowIds.filter(
    (_, idx) => decisions[idx].result === pluginPermissionCommon.AuthorizeResult.ALLOW
  );
};
const filterAuthorizedWorkflows = async (request, permissionsSvc, httpAuth, workflows) => {
  if (!workflows.overviews) {
    return workflows;
  }
  const authorizedWorkflowIds = await filterAuthorizedWorkflowIds(
    request,
    permissionsSvc,
    httpAuth,
    workflows.overviews.map((w) => w.workflowId)
  );
  const filtered = {
    ...workflows,
    overviews: workflows.overviews.filter(
      (w) => authorizedWorkflowIds.includes(w.workflowId)
    )
  };
  return filtered;
};
async function createBackendRouter(options) {
  const {
    config,
    logger,
    auditor,
    scheduler,
    permissions,
    httpAuth,
    userInfo
  } = options;
  const publicServices = initPublicServices(logger, config, scheduler);
  const routerApi = await initRouterApi(publicServices.orchestratorService);
  const router = express.Router();
  const permissionsIntegrationRouter = pluginPermissionNode.createPermissionIntegrationRouter({
    permissions: backstagePluginOrchestratorCommon.orchestratorPermissions
  });
  router.use(express__default.default.json());
  router.use(permissionsIntegrationRouter);
  router.use("/workflows", express__default.default.text());
  router.get("/health", (_, response) => {
    logger.info("PONG!");
    response.json({ status: "ok" });
  });
  setupInternalRoutes(
    publicServices,
    routerApi,
    permissions,
    httpAuth,
    auditor,
    userInfo
  );
  router.use((req, res, next) => {
    if (!next) {
      throw new Error("next is undefined");
    }
    return routerApi.openApiBackend.handleRequest(req, req, res, next).catch((error) => {
      auditor.createEvent({
        eventId: "generic-error-handler",
        request: req,
        // Keep at high since this is a fallback - any error should be caught in handlers
        severityLevel: "high",
        meta: {}
      }).then((event) => {
        event.fail({
          meta: {},
          error
        });
      });
      next(error);
    });
  });
  const middleware = rootHttpRouter.MiddlewareFactory.create({ logger, config });
  router.use(middleware.error({ logAllErrors: true }));
  return router;
}
function initPublicServices(logger, config, scheduler) {
  const dataIndexUrl = config.getString("orchestrator.dataIndexService.url");
  const dataIndexService = new DataIndexService.DataIndexService(dataIndexUrl, logger);
  const sonataFlowService = new SonataFlowService.SonataFlowService(dataIndexService, logger);
  const workflowCacheService = new WorkflowCacheService.WorkflowCacheService(
    logger,
    dataIndexService,
    sonataFlowService
  );
  workflowCacheService.schedule({ scheduler });
  const orchestratorService = new OrchestratorService.OrchestratorService(
    sonataFlowService,
    dataIndexService,
    workflowCacheService
  );
  const dataInputSchemaService = new DataInputSchemaService.DataInputSchemaService();
  return {
    orchestratorService,
    dataInputSchemaService
  };
}
async function initRouterApi(orchestratorService) {
  const openApiBackend = new openapiBackend.OpenAPIBackend({
    definition: backstagePluginOrchestratorCommon.openApiDocument,
    strict: false,
    ajvOpts: {
      strict: false,
      strictSchema: false,
      verbose: true,
      addUsedSchema: false,
      formats: formats.fullFormats
      // open issue: https://github.com/openapistack/openapi-backend/issues/280
    },
    handlers: {
      validationFail: async (c, _req, res) => {
        console.log("OPENAPI validationFail", c.operation);
        res.status(400).json({ err: c.validation.errors });
      },
      notFound: async (_c, req, res) => {
        res.status(404).json({ err: `${req.path} path not found` });
      },
      notImplemented: async (_c, req, res) => res.status(500).json({ err: `${req.path} not implemented` })
    }
  });
  await openApiBackend.init();
  const v2$1 = new v2.V2(orchestratorService);
  return { v2: v2$1, openApiBackend };
}
function setupInternalRoutes(services, routerApi, permissions, httpAuth, auditor, userInfo) {
  function manageDenyAuthorization(auditEvent) {
    const error = new pluginRbacCommon.UnauthorizedError();
    auditEvent.fail({
      meta: {
        message: "Not authorized to request the endpoint"
      },
      error: new pluginRbacCommon.UnauthorizedError()
    });
    throw error;
  }
  routerApi.openApiBackend.register(
    "getWorkflowsOverviewForEntity",
    async (_c, req, res, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-overview-entity",
        request: req
      });
      const targetEntity = req.body.targetEntity;
      const annotationWorkflowIds = req.body.annotationWorkflowIds;
      try {
        const result = await routerApi.v2.getWorkflowsOverviewForEntity(
          targetEntity,
          annotationWorkflowIds
        );
        const workflows = await filterAuthorizedWorkflows(
          req,
          permissions,
          httpAuth,
          result
        );
        auditEvent.success({
          meta: {
            workflowsCount: workflows.overviews?.length
          }
        });
        res.json(workflows);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
  routerApi.openApiBackend.register(
    "getWorkflowsOverview",
    async (_c, req, res, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-overview",
        request: req
      });
      try {
        const result = await routerApi.v2.getWorkflowsOverview(
          pagination.buildPagination(req),
          getRequestFilters(req)
        );
        const workflows = await filterAuthorizedWorkflows(
          req,
          permissions,
          httpAuth,
          result
        );
        auditEvent.success({
          meta: {
            workflowsCount: workflows.overviews?.length
          }
        });
        res.json(workflows);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
  routerApi.openApiBackend.register(
    "getWorkflowSourceById",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-source",
        request: req,
        meta: {
          actionType: "by-id",
          workflowId
        }
      });
      const decision = await authorize(
        req,
        [
          backstagePluginOrchestratorCommon.orchestratorWorkflowPermission,
          backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
        ],
        permissions,
        httpAuth
      );
      if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }
      try {
        const result = await routerApi.v2.getWorkflowSourceById(workflowId);
        auditEvent.success();
        res.status(200).contentType("text/plain").send(result);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
  routerApi.openApiBackend.register(
    "executeWorkflow",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const credentials = await httpAuth.credentials(req);
      const token = req.headers.authorization?.split(" ")[1];
      const initiatorEntity = await (await userInfo.getUserInfo(credentials)).userEntityRef;
      const auditEvent = await auditor.createEvent({
        eventId: "execute-workflow",
        request: req,
        meta: {
          workflowId
        }
      });
      const decision = await authorize(
        req,
        [
          backstagePluginOrchestratorCommon.orchestratorWorkflowUsePermission,
          backstagePluginOrchestratorCommon.orchestratorWorkflowUseSpecificPermission(workflowId)
        ],
        permissions,
        httpAuth
      );
      if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }
      const executeWorkflowRequestDTO = req.body;
      return routerApi.v2.executeWorkflow(
        executeWorkflowRequestDTO,
        workflowId,
        initiatorEntity,
        token
      ).then((result) => {
        auditEvent.success({ meta: { id: result.id } });
        return res.status(200).json(result);
      }).catch((error) => {
        auditEvent.fail({ error });
        next(error);
      });
    }
  );
  routerApi.openApiBackend.register(
    "retriggerInstance",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const instanceId = c.request.params.instanceId;
      const token = req.headers.authorization?.split(" ")[1];
      const retriggerInstanceRequestDTO = req.body;
      const auditEvent = await auditor.createEvent({
        eventId: "retrigger-instance",
        request: req,
        meta: {
          workflowId,
          instanceId
        }
      });
      const decision = await authorize(
        req,
        [
          backstagePluginOrchestratorCommon.orchestratorWorkflowUsePermission,
          backstagePluginOrchestratorCommon.orchestratorWorkflowUseSpecificPermission(workflowId)
        ],
        permissions,
        httpAuth
      );
      if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }
      await routerApi.v2.retriggerInstance(
        workflowId,
        instanceId,
        retriggerInstanceRequestDTO,
        token
      ).then((result) => {
        auditEvent.success();
        return res.status(200).json(result);
      }).catch((error) => {
        auditEvent.fail({ error });
        next(error);
      });
    }
  );
  routerApi.openApiBackend.register(
    "getWorkflowOverviewById",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-overview",
        request: req,
        meta: {
          actionType: "by-id",
          workflowId
        }
      });
      const decision = await authorize(
        req,
        [
          backstagePluginOrchestratorCommon.orchestratorWorkflowPermission,
          backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
        ],
        permissions,
        httpAuth
      );
      if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }
      return routerApi.v2.getWorkflowOverviewById(workflowId).then((result) => {
        auditEvent.success({
          meta: {
            workflowId: result.workflowId
          }
        });
        return res.json(result);
      }).catch((error) => {
        auditEvent.fail({ error });
        next(error);
      });
    }
  );
  routerApi.openApiBackend.register(
    "getWorkflowStatuses",
    async (_c, request, res, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-statuses",
        request
      });
      return routerApi.v2.getWorkflowStatuses().then((result) => {
        auditEvent.success();
        res.status(200).json(result);
      }).catch((error) => {
        auditEvent.fail({ error });
        next(error);
      });
    }
  );
  routerApi.openApiBackend.register(
    "getWorkflowInputSchemaById",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const instanceId = c.request.query.instanceId;
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-input-schema",
        request: req,
        meta: {
          actionType: "by-id",
          workflowId,
          instanceId
        }
      });
      try {
        const decision = await authorize(
          req,
          [
            backstagePluginOrchestratorCommon.orchestratorWorkflowPermission,
            backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
          ],
          permissions,
          httpAuth
        );
        if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }
        const workflowDefinition = await services.orchestratorService.fetchWorkflowInfo({
          definitionId: workflowId
        });
        if (!workflowDefinition) {
          throw new Error(
            `Failed to fetch workflow info for workflow ${workflowId}`
          );
        }
        const serviceUrl = workflowDefinition.serviceUrl;
        if (!serviceUrl) {
          throw new Error(
            `Service URL is not defined for workflow ${workflowId}`
          );
        }
        const definition = await services.orchestratorService.fetchWorkflowDefinition({
          definitionId: workflowId
        });
        if (!definition) {
          throw new Error(
            "Failed to fetch workflow definition for workflow ${workflowId}"
          );
        }
        if (!definition.dataInputSchema) {
          res.status(200).json({});
          return;
        }
        const instanceVariables = instanceId ? await services.orchestratorService.fetchInstanceVariables({
          instanceId
        }) : void 0;
        const workflowData = instanceVariables ? services.dataInputSchemaService.extractWorkflowData(
          instanceVariables
        ) : void 0;
        const workflowInfo = await routerApi.v2.getWorkflowInputSchemaById(
          workflowId,
          serviceUrl
        );
        if (!workflowInfo?.inputSchema?.properties) {
          auditEvent.success({
            meta: {
              message: "Successfully found nothing."
            }
          });
          res.status(200).json({});
          return;
        }
        const inputSchemaProps = workflowInfo.inputSchema.properties;
        let inputData;
        if (workflowData) {
          inputData = Object.keys(inputSchemaProps).filter((k) => k in workflowData).reduce((result, k) => {
            if (workflowData[k] === void 0) {
              return result;
            }
            result[k] = workflowData[k];
            return result;
          }, {});
        }
        auditEvent.success({
          meta: {
            workflowId: workflowInfo.id
          }
        });
        res.status(200).json({
          inputSchema: workflowInfo.inputSchema,
          data: inputData
        });
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
  routerApi.openApiBackend.register(
    "getWorkflowInstances",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const auditEvent = await auditor.createEvent({
        eventId: "get-workflow-instances",
        request: req
      });
      const decision = await authorize(
        req,
        [
          backstagePluginOrchestratorCommon.orchestratorWorkflowPermission,
          backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
        ],
        permissions,
        httpAuth
      );
      if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }
      return routerApi.v2.getInstances(pagination.buildPagination(req), getRequestFilters(req), [
        workflowId
      ]).then((result) => {
        auditEvent.success();
        res.json(result);
      }).catch((error) => {
        auditEvent.fail({ error });
        next(error);
      });
    }
  );
  routerApi.openApiBackend.register(
    "pingWorkflowServiceById",
    async (c, req, res, next) => {
      const workflowId = c.request.params.workflowId;
      const auditEvent = await auditor.createEvent({
        eventId: "ping-workflow-service",
        request: req
      });
      const decision = await authorize(
        req,
        [
          backstagePluginOrchestratorCommon.orchestratorWorkflowPermission,
          backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
        ],
        permissions,
        httpAuth
      );
      if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
        manageDenyAuthorization(auditEvent);
      }
      return routerApi.v2.pingWorkflowService(workflowId).then((result) => {
        auditEvent.success();
        res.json(result);
      }).catch((error) => {
        auditEvent.fail({ error });
        next(error);
      });
    }
  );
  routerApi.openApiBackend.register(
    "getInstances",
    async (_c, req, res, next) => {
      const auditEvent = await auditor.createEvent({
        eventId: "get-instances",
        request: req
      });
      try {
        const allWorkflowIds = routerApi.v2.getWorkflowIds();
        const authorizedWorkflowIds = await filterAuthorizedWorkflowIds(
          req,
          permissions,
          httpAuth,
          allWorkflowIds
        );
        if (!authorizedWorkflowIds || authorizedWorkflowIds.length === 0)
          res.json([]);
        const credentials = await httpAuth.credentials(req);
        const initiatorEntity = (await userInfo.getUserInfo(credentials)).userEntityRef;
        const isUserAuthorizedForInstanceAdminView = (
          // This permission will let user see ALL instances (including ones others created)
          await isUserAuthorizedForInstanceAdminViewPermission(
            req,
            permissions,
            httpAuth
          )
        );
        const requestFilters = getRequestFilters(req);
        let filters = requestFilters;
        if (!isUserAuthorizedForInstanceAdminView) {
          const initiatorEntityFilter = {
            operator: "EQ",
            value: initiatorEntity,
            field: "initiatorEntity"
          };
          const nestedVariablesFilter = {
            field: "variables",
            nested: initiatorEntityFilter
          };
          if (requestFilters === void 0) {
            filters = nestedVariablesFilter;
          } else {
            filters = {
              operator: "AND",
              filters: [nestedVariablesFilter, requestFilters]
            };
          }
        }
        const result = await routerApi.v2.getInstances(
          pagination.buildPagination(req),
          filters,
          authorizedWorkflowIds
        );
        auditEvent.success({ meta: { authorizedWorkflowIds } });
        res.json(result);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
  routerApi.openApiBackend.register(
    "getInstanceById",
    async (c, request, res, next) => {
      const instanceId = c.request.params.instanceId;
      const auditEvent = await auditor.createEvent({
        eventId: "get-instance",
        request,
        meta: {
          actionType: "by-id",
          instanceId
        }
      });
      try {
        const instance = await routerApi.v2.getInstanceById(instanceId);
        const workflowId = instance.processId;
        const decision = await authorize(
          request,
          [
            backstagePluginOrchestratorCommon.orchestratorWorkflowPermission,
            backstagePluginOrchestratorCommon.orchestratorWorkflowSpecificPermission(workflowId)
          ],
          permissions,
          httpAuth
        );
        if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }
        const credentials = await httpAuth.credentials(request);
        const initiatorEntity = (await userInfo.getUserInfo(credentials)).userEntityRef;
        const isUserAuthorizedForInstanceAdminView = await isUserAuthorizedForInstanceAdminViewPermission(
          request,
          permissions,
          httpAuth
        );
        if (!isUserAuthorizedForInstanceAdminView) {
          const instanceInitiatorEntity = instance.initiatorEntity;
          if (instanceInitiatorEntity !== initiatorEntity) {
            throw new Error(
              `Unauthorized to access instance ${instanceId} not initiated by user.`
            );
          }
        }
        auditEvent.success();
        res.status(200).json(instance);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
  routerApi.openApiBackend.register(
    "abortWorkflow",
    async (c, request, res, next) => {
      const instanceId = c.request.params.instanceId;
      const auditEvent = await auditor.createEvent({
        eventId: "abort-workflow",
        request,
        meta: {
          actionType: "by-id",
          instanceId
        }
      });
      try {
        const instance = await routerApi.v2.getInstanceById(instanceId);
        const workflowId = instance.processId;
        const decision = await authorize(
          request,
          [
            backstagePluginOrchestratorCommon.orchestratorWorkflowUsePermission,
            backstagePluginOrchestratorCommon.orchestratorWorkflowUseSpecificPermission(workflowId)
          ],
          permissions,
          httpAuth
        );
        if (decision.result === pluginPermissionCommon.AuthorizeResult.DENY) {
          manageDenyAuthorization(auditEvent);
        }
        const result = await routerApi.v2.abortWorkflow(workflowId, instanceId);
        auditEvent.success({ meta: { result } });
        res.status(200).json(result);
      } catch (error) {
        auditEvent.fail({ error });
        next(error);
      }
    }
  );
}
function getRequestFilters(req) {
  return req.body.filters ? req.body.filters : void 0;
}

exports.createBackendRouter = createBackendRouter;
//# sourceMappingURL=router.cjs.js.map
