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
import type {
  AuditorService,
  AuditorServiceEvent,
  AuthService,
  CacheService,
  DatabaseService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import type { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

import { fullFormats } from 'ajv-formats/dist/formats';
import express, { Router, type Request, type Response } from 'express';
import {
  Document,
  OpenAPIBackend,
  type Context,
  type Request as OpenAPIRequest,
} from 'openapi-backend';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { CatalogHttpClient } from '../catalog/catalogHttpClient';
import { CatalogInfoGenerator } from '../catalog/catalogInfoGenerator';
import { migrate } from '../database/migration';
import {
  OrchestratorWorkflowDao,
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from '../database/repositoryDao';
import type { Components, Paths, SourceImport } from '../generated/openapi.d';
import { openApiDocument } from '../generated/openapidocument';
import { GithubApiService } from '../github';
import { GitlabApiService } from '../gitlab';
import {
  getImportTemplateRef,
  parseGitURLForApprovalTool,
  permissionCheck,
} from '../helpers';
import { auditCreateEvent } from '../helpers/auditorUtils';
import {
  createImportJobs,
  deleteImportByRepo,
  deleteRepositoryRecord,
  findAllImports,
  findImportStatusByRepo,
  findOrchestratorImportStatusByRepo,
  findTaskImportStatusByRepo,
  sortImports,
} from './handlers/import';
import { createWorkflowImportJobs } from './handlers/import/execute-orchestrator-workflow';
import { createTaskImportJobs } from './handlers/import/execute-template';
import { findAllOrganizations } from './handlers/organization';
import { ping } from './handlers/ping';
import {
  findAllRepositories,
  findRepositoriesByOrganization,
} from './handlers/repository';

/**
 * Router Options
 * @public
 */
export interface RouterOptions {
  logger: LoggerService;
  permissions: PermissionEvaluator;
  config: Config;
  cache: CacheService;
  discovery: DiscoveryService;
  httpAuth: HttpAuthService;
  auth: AuthService;
  catalogApi: CatalogApi;
  auditor: AuditorService;
  database: DatabaseService;
}

namespace Operations {
  export const PING = 'ping';
  export const FIND_ALL_ORGANIZATIONS = 'findAllOrganizations';
  export const FIND_ALL_REPOSITORIES = 'findAllRepositories';

  export const FIND_REPOSITORIES_BY_ORGANIZATION =
    'findRepositoriesByOrganization';

  export const FIND_ALL_IMPORTS = 'findAllImports';
  export const FIND_ALL_TASK_IMPORTS = 'findAllTaskImports';
  export const FIND_ALL_ORCHESTRATOR_WORKFLOW_IMPORTS =
    'findAllOrchestratorWorkflowImports';

  export const CREATE_IMPORT_JOBS = 'createImportJobs';
  export const CREATE_TASK_IMPORT_JOBS = 'createTaskImportJobs';
  export const CREATE_ORCHESTRATOR_WORKFLOW_JOBS =
    'createOrchestratorWorkflowJobs';

  export const FIND_IMPORT_STATUS_BY_REPO = 'findImportStatusByRepo';
  export const FIND_TASK_IMPORT_STATUS_BY_REPO = 'findTaskImportStatusByRepo';
  export const FIND_ORCHESTRATOR_IMPORT_STATUS_BY_REPO =
    'findOrchestratorImportStatusByRepo';

  export const DELETE_IMPORT_BY_REPO = 'deleteImportByRepo';
  export const DELETE_TASK_IMPORT_BY_REPO = 'deleteTaskImportByRepo';
  export const DELETE_ORCHESTRATOR_IMPORT_BY_REPO =
    'deleteOrchestratorImportByRepo';
}

/**
 * Router
 * @public
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const {
    logger,
    httpAuth,
    auth,
    permissions,
    config,
    cache,
    discovery,
    catalogApi,
    auditor: auditor,
    database,
  } = options;

  const knex = await migrate(database);
  const repositoryDao = new RepositoryDao(knex, logger, 'repositories');
  const taskDao = new ScaffolderTaskDao(knex);
  const taskLocationsDao = new TaskLocationsDao(knex);
  const orchestratorRepositoryDao = new RepositoryDao(
    knex,
    logger,
    'orchestrator_repositories',
  );
  const orchestratorWorkflowDao = new OrchestratorWorkflowDao(knex);
  // This should probably be sometype of object that holds all the scm API service objects
  const githubApiService = new GithubApiService(logger, config, cache);
  const gitlabApiService = new GitlabApiService(logger, config, cache);
  const catalogHttpClient = new CatalogHttpClient({
    logger,
    config,
    discovery,
    auth,
    catalogApi,
  });
  const catalogInfoGenerator = new CatalogInfoGenerator(
    logger,
    catalogHttpClient,
  );

  // create openapi requests handler
  const api = new OpenAPIBackend({
    ajvOpts: {
      verbose: true,
      formats: fullFormats, // open issue: https://github.com/openapistack/openapi-backend/issues/280
    },
    validate: true,
    definition: openApiDocument,
    handlers: {
      validationFail: async (c, _req: Request, res: Response) =>
        res.status(400).json({ err: c.validation.errors }),
      notFound: async (_c, req: Request, res: Response) =>
        res.status(404).json({ err: `'${req.method} ${req.path}' not found` }),
      notImplemented: async (_c, req: Request, res: Response) =>
        res
          .status(500)
          .json({ err: `'${req.method} ${req.path}' not implemented` }),
    },
  });

  const templateRef = config.getOptionalString('bulkImport.importTemplate');
  let finalTemplateRef: string | undefined;
  if (templateRef) {
    finalTemplateRef = getImportTemplateRef(templateRef);
  }

  const orchestratorWorkflowId = config.getOptionalString(
    'bulkImport.orchestratorWorkflow',
  );

  await api.init();

  api.register(
    Operations.PING,
    async (_c: Context, _req: Request, res: Response) => {
      const result = await ping(logger);
      return res.status(result.statusCode).json(result.responseBody);
    },
  );

  api.register(
    Operations.FIND_ALL_ORGANIZATIONS,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.FindAllOrganizations.QueryParameters = {
        ...c.request.query,
      };
      // we need to convert strings to real types due to open PR https://github.com/openapistack/openapi-backend/pull/571
      q.pagePerIntegration = stringToNumber(q.pagePerIntegration);
      q.sizePerIntegration = stringToNumber(q.sizePerIntegration);
      const response = await findAllOrganizations(
        logger,
        q.approvalTool === 'GITLAB' ? gitlabApiService : githubApiService,
        q.search,
        q.pagePerIntegration,
        q.sizePerIntegration,
      );
      return res.status(response.statusCode).json({
        errors: response.responseBody?.errors,
        organizations: response.responseBody?.organizations,
        totalCount: response.responseBody?.totalCount,
        pagePerIntegration: response.responseBody?.pagePerIntegration,
        sizePerIntegration: response.responseBody?.sizePerIntegration,
        approvalTool: q.approvalTool,
      } as Components.Schemas.OrganizationList);
    },
  );

  api.register(
    Operations.FIND_ALL_REPOSITORIES,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.FindAllRepositories.QueryParameters = {
        ...c.request.query,
      };
      // we need to convert strings to real types due to open PR https://github.com/openapistack/openapi-backend/pull/571
      q.pagePerIntegration = stringToNumber(q.pagePerIntegration);
      q.sizePerIntegration = stringToNumber(q.sizePerIntegration);
      q.checkImportStatus = stringToBoolean(q.checkImportStatus);
      const response = await findAllRepositories(
        {
          logger,
          config,
          gitApiService:
            q.approvalTool === 'GITLAB' ? gitlabApiService : githubApiService,
          catalogHttpClient,
        },
        {
          search: q.search,
          checkStatus: q.checkImportStatus,
          pageNumber: q.pagePerIntegration,
          pageSize: q.sizePerIntegration,
          approvalTool: q.approvalTool,
        },
      );
      const repos = response.responseBody?.repositories;
      return res.status(response.statusCode).json({
        errors: response.responseBody?.errors,
        repositories: repos,
        totalCount: response.responseBody?.totalCount,
        pagePerIntegration: q.pagePerIntegration,
        sizePerIntegration: q.sizePerIntegration,
        approvalTool: q.approvalTool,
      } as Components.Schemas.RepositoryList);
    },
  );

  api.register(
    Operations.FIND_REPOSITORIES_BY_ORGANIZATION,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.FindRepositoriesByOrganization.QueryParameters = {
        ...c.request.query,
      };
      // we need to convert strings to real types due to open PR https://github.com/openapistack/openapi-backend/pull/571
      q.pagePerIntegration = stringToNumber(q.pagePerIntegration);
      q.sizePerIntegration = stringToNumber(q.sizePerIntegration);
      q.checkImportStatus = stringToBoolean(q.checkImportStatus);
      const response = await findRepositoriesByOrganization(
        {
          logger,
          config,
          gitApiService:
            q.approvalTool === 'GITLAB' ? gitlabApiService : githubApiService,
          catalogHttpClient,
        },
        c.request.params.organizationName?.toString(),
        q.search,
        q.checkImportStatus,
        q.pagePerIntegration,
        q.sizePerIntegration,
      );
      const repos = response.responseBody?.repositories;
      return res.status(response.statusCode).json({
        errors: response.responseBody?.errors,
        repositories: repos,
        totalCount: response.responseBody?.totalCount,
        pagePerIntegration: q.pagePerIntegration,
        sizePerIntegration: q.sizePerIntegration,
        approvalTool: q.approvalTool,
      } as Components.Schemas.RepositoryList);
    },
  );

  api.register(
    Operations.FIND_ALL_IMPORTS,
    async (c: Context, _req: Request, res: Response) => {
      const {
        pageNumber,
        pageSize,
        apiVersion,
        search,
        sortColumn,
        sortOrder,
      } = getFindImportsParams(c);
      const response = await findAllImports(
        {
          logger,
          config,
          githubApiService,
          gitlabApiService,
          catalogHttpClient,
        },
        {
          apiVersion,
        },
        {
          search,
          pageNumber,
          pageSize,
          sortColumn,
          sortOrder,
        },
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );
  api.register(
    Operations.FIND_ALL_TASK_IMPORTS,
    async (c: Context, _req: Request, res: Response) => {
      const { pageNumber, pageSize, search, sortColumn, sortOrder } =
        getFindImportsParams(c);
      const imports: SourceImport[] = [];
      const repositories = await repositoryDao.findRepositories(
        pageNumber,
        pageSize,
        search,
      );

      for (const repo of repositories.data) {
        const response = await findTaskImportStatusByRepo(
          {
            logger,
            config,
            githubApiService,
            gitlabApiService,
            catalogHttpClient,
            repositoryDao,
            taskDao,
            taskLocationsDao,
            discovery,
            auth,
          },
          repo.url,
          true,
        );
        if (response.responseBody) {
          imports.push(response.responseBody);
        }
      }

      sortImports(imports, sortColumn, sortOrder);

      const responseBody: Components.Schemas.ImportJobListV2 = {
        imports,
        totalCount: repositories.total,
        page: pageNumber || 1,
        size: pageSize || 5,
      };

      return res.status(200).json(responseBody);
    },
  );

  api.register(
    Operations.FIND_ALL_ORCHESTRATOR_WORKFLOW_IMPORTS,
    async (c: Context, req: Request, res: Response) => {
      const { pageNumber, pageSize, search, sortColumn, sortOrder } =
        getFindImportsParams(c);
      const imports: SourceImport[] = [];
      const repositories = await orchestratorRepositoryDao.findRepositories(
        pageNumber,
        pageSize,
        search,
      );

      const token = getBearerTokenFromReq(req);

      for (const repo of repositories.data) {
        const response = await findOrchestratorImportStatusByRepo(
          {
            logger,
            orchestratorRepositoryDao,
            orchestratorWorkflowDao,
            discovery,
          },
          repo.url,
          token,
          true,
        );
        if (response.responseBody) {
          imports.push(response.responseBody);
        }
      }

      sortImports(imports, sortColumn, sortOrder);

      const responseBody: Components.Schemas.ImportJobListV2 = {
        imports,
        totalCount: repositories.total,
        page: pageNumber || 1,
        size: pageSize || 5,
      };

      return res.status(200).json(responseBody);
    },
  );

  api.register(
    Operations.CREATE_IMPORT_JOBS,
    async (
      c: Context<Paths.CreateImportJobs.RequestBody>,
      _req: Request,
      res: Response,
    ) => {
      const q: Paths.CreateImportJobs.QueryParameters = {
        ...c.request.query,
      };
      q.dryRun = stringToBoolean(q.dryRun);
      const response = await createImportJobs(
        {
          logger,
          config,
          auth,
          catalogApi,
          gitlabApiService,
          githubApiService,
          catalogInfoGenerator,
          catalogHttpClient,
        },
        {
          importRequests: c.request.requestBody,
          dryRun: q.dryRun,
        },
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.CREATE_TASK_IMPORT_JOBS,
    async (
      c: Context<Paths.CreateImportJobs.RequestBody>,
      _req: Request,
      res: Response,
    ) => {
      if (!finalTemplateRef) {
        throw new Error(
          `Missing required config value: 'bulkImport.importTemplate'`,
        );
      }
      const response = await createTaskImportJobs(
        finalTemplateRef,
        discovery,
        logger,
        auth,
        config,
        repositoryDao,
        taskDao,
        taskLocationsDao,
        c.request.requestBody,
        githubApiService,
      );

      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.CREATE_ORCHESTRATOR_WORKFLOW_JOBS,
    async (
      c: Context<Paths.CreateImportJobs.RequestBody>,
      req: Request,
      res: Response,
    ) => {
      if (!orchestratorWorkflowId) {
        throw new Error(
          `Missing required config value: 'bulkImport.orchestratorWorkflow'`,
        );
      }

      const token = getBearerTokenFromReq(req);

      const response = await createWorkflowImportJobs({
        orchestratorWorkflowId,
        discovery,
        token,
        requestBody: c.request.requestBody,
        orchestratorWorkflowDao,
        orchestratorRepositoryDao,
        githubApiService,
        gitlabApiService,
      });

      res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.FIND_TASK_IMPORT_STATUS_BY_REPO,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.FindImportStatusByRepo.QueryParameters = {
        ...c.request.query,
      };
      if (!q.repo?.trim()) {
        throw new Error('missing or blank parameter');
      }
      const response = await findTaskImportStatusByRepo(
        {
          logger,
          config,
          githubApiService,
          gitlabApiService,
          catalogHttpClient,
          repositoryDao,
          taskDao,
          taskLocationsDao,
          discovery,
          auth,
        },
        q.repo,
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.FIND_IMPORT_STATUS_BY_REPO,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.FindImportStatusByRepo.QueryParameters = {
        ...c.request.query,
      };
      if (!q.repo?.trim()) {
        throw new Error('missing or blank parameter');
      }
      const response = await findImportStatusByRepo(
        {
          logger,
          config,
          gitApiService:
            q.approvalTool === 'GITLAB' ? gitlabApiService : githubApiService,
          catalogHttpClient,
          approvalTool: q.approvalTool,
        },
        q.repo,
        q.defaultBranch,
        true,
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.FIND_ORCHESTRATOR_IMPORT_STATUS_BY_REPO,
    async (c: Context, req: Request, res: Response) => {
      const q: Paths.FindImportStatusByRepo.QueryParameters = {
        ...c.request.query,
      };
      if (!q.repo?.trim()) {
        throw new Error('missing or blank parameter');
      }
      const token = getBearerTokenFromReq(req);
      const response = await findOrchestratorImportStatusByRepo(
        {
          logger,
          orchestratorRepositoryDao,
          orchestratorWorkflowDao,
          discovery,
        },
        q.repo,
        token,
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.DELETE_TASK_IMPORT_BY_REPO,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.DeleteImportByRepo.QueryParameters = {
        ...c.request.query,
      };
      if (!q.repo?.trim()) {
        throw new Error('missing or blank "repo" parameter');
      }
      const response = await deleteRepositoryRecord(
        {
          logger,
          dao: repositoryDao,
        },
        q.repo,
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.DELETE_IMPORT_BY_REPO,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.DeleteImportByRepo.QueryParameters = {
        ...c.request.query,
      };
      if (!q.repo?.trim()) {
        throw new Error('missing or blank "repo" parameter');
      }
      const response = await deleteImportByRepo(
        {
          logger,
          config,
          gitApiService:
            parseGitURLForApprovalTool(q.repo) === 'GITLAB'
              ? gitlabApiService
              : githubApiService,
          catalogHttpClient,
        },
        q.repo,
        q.defaultBranch,
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  api.register(
    Operations.DELETE_ORCHESTRATOR_IMPORT_BY_REPO,
    async (c: Context, _req: Request, res: Response) => {
      const q: Paths.DeleteImportByRepo.QueryParameters = {
        ...c.request.query,
      };
      if (!q.repo?.trim()) {
        throw new Error('missing or blank "repo" parameter');
      }
      const response = await deleteRepositoryRecord(
        {
          logger,
          dao: orchestratorRepositoryDao,
        },
        q.repo,
      );
      return res.status(response.statusCode).json(response.responseBody);
    },
  );

  const router = Router();
  router.use(express.json());

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: [bulkImportPermission],
  });
  router.use(permissionIntegrationRouter);

  router.use(async (req, _res, next) => {
    if (req.path !== '/ping') {
      await permissionCheck(
        auditor,
        api.matchOperation(req as OpenAPIRequest)?.operationId,
        permissions,
        httpAuth,
        req,
      ).catch(next);
    }
    next();
  });

  router.use(async (req, res, next) => {
    const reqCast = req as OpenAPIRequest;
    const operationId = api.matchOperation(reqCast)?.operationId;

    const auditorEvent = await createAuditorEventByOperationId(
      operationId,
      req,
      auditor,
    );
    try {
      const response = (await api.handleRequest(reqCast, req, res)) as Response;
      auditorEvent?.success({ meta: { responseStatus: response.statusCode } });
      next();
    } catch (err: any) {
      auditorEvent?.fail({ error: err, meta: { responseStatus: 500 } });
      next(err);
    }
  });

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}

async function createAuditorEventByOperationId(
  operationId: string | undefined,
  req: Request,
  auditor: AuditorService,
): Promise<AuditorServiceEvent | undefined> {
  let auditorEvent;
  switch (operationId) {
    case Operations.PING:
      auditorEvent = await auditCreateEvent(auditor, 'ping', req);
      break;
    case Operations.FIND_ALL_ORGANIZATIONS:
      auditorEvent = await auditCreateEvent(auditor, 'org-read', req, {
        queryType: req.query.search ? 'by-query' : 'all',
        search: req.query?.search,
      });
      break;
    case Operations.FIND_ALL_REPOSITORIES:
      auditorEvent = await auditCreateEvent(auditor, 'repo-read', req, {
        queryType: req.query.search ? 'by-query' : 'all',
        search: req.query.search,
      });
      break;
    case Operations.FIND_REPOSITORIES_BY_ORGANIZATION: {
      const organizationName = req.params.organizationName?.toString();
      auditorEvent = await auditCreateEvent(auditor, 'repo-read', req, {
        queryType: 'by-org',
        organizationName,
      });
      break;
    }
    case Operations.FIND_ALL_IMPORTS:
    case Operations.FIND_ALL_TASK_IMPORTS:
    case Operations.FIND_ALL_ORCHESTRATOR_WORKFLOW_IMPORTS:
      auditorEvent = await auditCreateEvent(auditor, 'import-read', req, {
        queryType: req.query.search ? 'by-query' : 'all',
        search: req.query.search,
      });
      break;
    case Operations.CREATE_IMPORT_JOBS:
    case Operations.CREATE_TASK_IMPORT_JOBS:
    case Operations.CREATE_ORCHESTRATOR_WORKFLOW_JOBS:
      auditorEvent = await auditCreateEvent(auditor, 'import-write', req, {
        actionType: 'create',
      });
      break;
    case Operations.FIND_IMPORT_STATUS_BY_REPO:
    case Operations.FIND_TASK_IMPORT_STATUS_BY_REPO:
    case Operations.FIND_ORCHESTRATOR_IMPORT_STATUS_BY_REPO:
      auditorEvent = await auditCreateEvent(
        auditor,
        'import-status-read',
        req,
        { queryType: 'by-query', repo: req.query.repo },
      );
      break;
    case Operations.DELETE_IMPORT_BY_REPO:
    case Operations.DELETE_TASK_IMPORT_BY_REPO:
    case Operations.DELETE_ORCHESTRATOR_IMPORT_BY_REPO:
      auditorEvent = await auditCreateEvent(auditor, 'import-write', req, {
        actionType: 'delete',
        repository: req.query.repo,
      });
      break;
    case undefined:
      auditorEvent = await auditCreateEvent(auditor, operationId, req);
      break;
    default:
      // do nothing
      break;
  }
  return auditorEvent;
}

function stringToNumber(s: number | undefined): number | undefined {
  return s ? Number.parseInt(s.toString(), 10) : undefined;
}

function stringToBoolean(s: boolean | undefined): boolean | undefined {
  if (!s) {
    return undefined;
  }
  return s.toString() === 'true';
}
function getFindImportsParams(c: Context<any, any, any, any, any, Document>): {
  pageNumber?: number;
  pageSize?: number;
  apiVersion?: Paths.FindAllImports.Parameters.ApiVersion;
  search?: string;
  sortColumn?: Components.Parameters.SortColumnQueryParam;
  sortOrder?: Components.Parameters.SortOrderQueryParam;
} {
  const h: Paths.FindAllImports.HeaderParameters = {
    ...c.request.headers,
  };
  const apiVersion = h['api-version'];
  const q: Paths.FindAllImports.QueryParameters = {
    ...c.request.query,
  };
  // we need to convert strings to real types due to open PR https://github.com/openapistack/openapi-backend/pull/571
  let pageNumber: number | undefined;
  let pageSize: number | undefined;
  if (apiVersion === undefined || apiVersion === 'v1') {
    // pagePerIntegration and sizePerIntegration deprecated in v1. 'page' and 'size' take precedence.
    pageNumber = stringToNumber(q.page || q.pagePerIntegration);
    pageSize = stringToNumber(q.size || q.sizePerIntegration);
  } else {
    // pagePerIntegration and sizePerIntegration removed in v2+ and replaced by 'page' and 'size'.
    pageNumber = stringToNumber(q.page);
    pageSize = stringToNumber(q.size);
  }
  return {
    pageNumber,
    pageSize,
    apiVersion: apiVersion,
    search: q.search,
    sortColumn: q.sortColumn,
    sortOrder: q.sortOrder,
  };
}

function getBearerTokenFromReq(req: express.Request): string {
  const header = req.header('authorization') ?? req.headers.authorization;
  if (header?.startsWith(`Bearer `)) {
    return header.replace('Bearer ', '');
  }
  throw new InputError(`Request provided without token`);
}
