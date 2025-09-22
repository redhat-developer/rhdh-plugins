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
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import type { Config } from '@backstage/config';
import type { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

import { fullFormats } from 'ajv-formats/dist/formats';
import express, { Router, type Request, type Response } from 'express';
import {
  OpenAPIBackend,
  type Context,
  type Request as OpenAPIRequest,
} from 'openapi-backend';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { CatalogHttpClient } from '../catalog/catalogHttpClient';
import { CatalogInfoGenerator } from '../catalog/catalogInfoGenerator';
import type { Components, Paths } from '../generated/openapi.d';
import { openApiDocument } from '../generated/openapidocument';
import { GithubApiService } from '../github';
import { GitlabApiService } from '../gitlab';
import { parseGitURLForApprovalTool, permissionCheck } from '../helpers';
import { auditCreateEvent } from '../helpers/auditorUtils';
import {
  createImportJobs,
  deleteImportByRepo,
  findAllImports,
  findImportStatusByRepo,
} from './handlers/import';
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
}

namespace Operations {
  export const PING = 'ping';
  export const FIND_ALL_ORGANIZATIONS = 'findAllOrganizations';
  export const FIND_ALL_REPOSITORIES = 'findAllRepositories';
  export const FIND_REPOSITORIES_BY_ORGANIZATION =
    'findRepositoriesByOrganization';
  export const FIND_ALL_IMPORTS = 'findAllImports';
  export const CREATE_IMPORT_JOBS = 'createImportJobs';
  export const FIND_IMPORT_STATUS_BY_REPO = 'findImportStatusByRepo';
  export const DELETE_IMPORT_BY_REPO = 'deleteImportByRepo';
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
  } = options;
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
      const h: Paths.FindAllImports.HeaderParameters = {
        ...c.request.headers,
      };
      const apiVersion = h['api-version'];
      const q: Paths.FindAllImports.QueryParameters = {
        ...c.request.query,
      };
      // we need to convert strings to real types due to open PR https://github.com/openapistack/openapi-backend/pull/571
      let page: number | undefined;
      let size: number | undefined;
      if (apiVersion === undefined || apiVersion === 'v1') {
        // pagePerIntegration and sizePerIntegration deprecated in v1. 'page' and 'size' take precedence.
        page = stringToNumber(q.page || q.pagePerIntegration);
        size = stringToNumber(q.size || q.sizePerIntegration);
      } else {
        // pagePerIntegration and sizePerIntegration removed in v2+ and replaced by 'page' and 'size'.
        page = stringToNumber(q.page);
        size = stringToNumber(q.size);
      }
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
          search: q.search,
          pageNumber: page,
          pageSize: size,
          sortColumn: q.sortColumn,
          sortOrder: q.sortOrder,
        },
      );
      return res.status(response.statusCode).json(response.responseBody);
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
      auditorEvent = await auditCreateEvent(auditor, 'import-read', req, {
        queryType: req.query.search ? 'by-query' : 'all',
        search: req.query.search,
      });
      break;
    case Operations.CREATE_IMPORT_JOBS:
      auditorEvent = await auditCreateEvent(auditor, 'import-write', req, {
        actionType: 'create',
        dryRun: req.query.dryRun,
      });
      break;
    case Operations.FIND_IMPORT_STATUS_BY_REPO:
      auditorEvent = await auditCreateEvent(
        auditor,
        'import-status-read',
        req,
        { queryType: 'by-query', repo: req.query.repo },
      );
      break;
    case Operations.DELETE_IMPORT_BY_REPO:
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
