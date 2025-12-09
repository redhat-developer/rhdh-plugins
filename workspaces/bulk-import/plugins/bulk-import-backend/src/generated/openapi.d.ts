// GENERATED FILE. DO NOT EDIT.

// eslint-disable
// prettier-ignore
import type { OpenAPIClient, Parameters, UnknownParamsObject, OperationResponse, AxiosRequestConfig } from 'openapi-client-axios';

declare namespace Components {
  export interface HeaderParameters {
    apiVersionHeaderParam?: Parameters.ApiVersionHeaderParam;
  }
  namespace Parameters {
    export type ApiVersionHeaderParam = 'v1' | 'v2';
    export type ApprovalToolParam = string;
    export type PagePerIntegrationQueryParam = number;
    export type PagePerIntegrationQueryParamDeprecated = number;
    export type PageQueryParam = number;
    export type SearchQueryParam = string;
    export type SizePerIntegrationQueryParam = number;
    export type SizePerIntegrationQueryParamDeprecated = number;
    export type SizeQueryParam = number;
    export type SortColumnQueryParam =
      | 'repository.name'
      | 'repository.organization'
      | 'repository.url'
      | 'lastUpdate'
      | 'status';
    export type SortOrderQueryParam = 'asc' | 'desc';
  }
  export interface QueryParameters {
    pagePerIntegrationQueryParam?: Parameters.PagePerIntegrationQueryParam;
    sizePerIntegrationQueryParam?: Parameters.SizePerIntegrationQueryParam;
    pagePerIntegrationQueryParamDeprecated?: Parameters.PagePerIntegrationQueryParamDeprecated;
    sortColumnQueryParam?: Parameters.SortColumnQueryParam;
    sortOrderQueryParam?: Parameters.SortOrderQueryParam;
    sizePerIntegrationQueryParamDeprecated?: Parameters.SizePerIntegrationQueryParamDeprecated;
    searchQueryParam?: Parameters.SearchQueryParam;
    pageQueryParam?: Parameters.PageQueryParam;
    sizeQueryParam?: Parameters.SizeQueryParam;
    approvalToolParam?: Parameters.ApprovalToolParam;
  }
  namespace Schemas {
    export type ApprovalTool = 'GIT' | 'SERVICENOW' | 'GITLAB';
    /**
     * Import Job
     */
    export interface Import {
      id?: string;
      status?: /* Import Job status */
        ImportStatus | /* Import Job status */ TaskImportStatus;
      task?: {
        taskId?: string;
      };
      tasks?: {
        taskId?: string;
      }[];
      /**
       * Specified entity name in the catalog. Filled only in response for dry-run import requests.
       */
      catalogEntityName?: string;
      lastUpdate?: string; // date-time
      errors?: string[];
      approvalTool?: ApprovalTool;
      repository?: /* Repository */ Repository;
      /**
       * GitLab details. Applicable if approvalTool is gitlab.
       */
      gitlab?: {
        pullRequest?: PullRequest;
      };
      /**
       * GitHub details. Applicable if approvalTool is git.
       */
      github?: {
        pullRequest?: PullRequest;
      };
    }
    /**
     * Import Job List
     */
    export interface ImportJobListV2 {
      imports?: /* Import Job with source it originates from */ SourceImport[];
      errors?: string[];
      totalCount?: number;
      page?: number;
      size?: number;
    }
    /**
     * Import Job request
     */
    export interface ImportRequest {
      approvalTool?: ApprovalTool;
      /**
       * Expected Entity name in the catalog. Relevant only if the 'dryRun' query parameter is set to 'true'.
       */
      catalogEntityName?: string;
      /**
       * Whether the CODEOWNERS file will be used as entity owner. Only relevant for dry-run requests. If set to 'false', the corresponding dry-run check will be skipped.
       */
      codeOwnersFileAsEntityOwner?: boolean;
      repository: {
        /**
         * repository name
         */
        name?: string;
        /**
         * repository URL
         */
        url: string;
        /**
         * organization which the repository is part of
         */
        organization?: string;
        /**
         * default branch
         */
        defaultBranch?: string;
      };
      /**
       * content of the catalog-info.yaml to include in the import Pull Request.
       */
      catalogInfoContent?: string;
      /**
       * GitLab details. Applicable if approvalTool is gitlab.
       */
      gitlab?: {
        pullRequest?: PullRequest;
      };
      /**
       * GitHub details. Applicable if approvalTool is git.
       */
      github?: {
        pullRequest?: PullRequest;
      };
    }
    /**
     * Import Job status
     */
    export type ImportStatus = 'ADDED' | 'WAIT_PR_APPROVAL' | 'PR_ERROR' | null;
    /**
     * Organization
     */
    export interface Organization {
      /**
       * unique identifier
       */
      id?: string;
      /**
       * organization name
       */
      name?: string;
      /**
       * organization description
       */
      description?: string;
      /**
       * organization URL
       */
      url?: string;
      /**
       * total number of repositories in this Organization
       */
      totalRepoCount?: number;
      errors?: string[];
    }
    /**
     * Organization List
     */
    export interface OrganizationList {
      organizations?: /* Organization */ Organization[];
      errors?: string[];
      totalCount?: number;
      pagePerIntegration?: number;
      sizePerIntegration?: number;
    }
    export interface PullRequest {
      /**
       * URL of the Pull Request
       */
      url?: string;
      /**
       * Pull Request number
       */
      number?: number;
      /**
       * title of the Pull Request
       */
      title?: string;
      /**
       * body of the Pull Request
       */
      body?: string;
      /**
       * content of the catalog-info.yaml as fetched from the Pull Request.
       */
      catalogInfoContent?: string;
      status?: 'WAIT_PR_APPROVAL' | 'PR_MERGED' | 'PR_ERROR';
    }
    /**
     * Repository
     */
    export interface Repository {
      /**
       * unique identifier
       */
      id?: string;
      /**
       * repository name
       */
      name?: string;
      /**
       * repository URL
       */
      url?: string;
      /**
       * organization which the repository is part of
       */
      organization?: string;
      importStatus?: /* Import Job status */
        ImportStatus | /* Import Job status */ TaskImportStatus;
      /**
       * default branch
       */
      defaultBranch?: string;
      lastUpdate?: string; // date-time
      errors?: string[];
    }
    /**
     * Repository List
     */
    export interface RepositoryList {
      repositories?: /* Repository */ Repository[];
      errors?: string[];
      totalCount?: number;
      pagePerIntegration?: number;
      sizePerIntegration?: number;
    }
    /**
     * Scaffolder Task
     */
    export interface ScaffolderTask {
      taskId?: string;
      repositoryId?: number;
      locations?: string[];
    }
    /**
     * Import Source:
     *   * 'config' - Import from static catalog location configuration in 'app-config'
     *   * 'location' - Import of user registered entities using locations endpoint
     *   * 'integration' - Import using a GitHub integration
     *   * null - Import source is unknown
     *
     */
    export type Source = 'config' | 'location' | 'integration' | null;
    /**
     * Import Job with source it originates from
     */
    export interface SourceImport {
      id?: string;
      status?: /* Import Job status */
        ImportStatus | /* Import Job status */ TaskImportStatus;
      task?: {
        taskId?: string;
      };
      tasks?: {
        taskId?: string;
      }[];
      /**
       * Specified entity name in the catalog. Filled only in response for dry-run import requests.
       */
      catalogEntityName?: string;
      lastUpdate?: string; // date-time
      errors?: string[];
      approvalTool?: ApprovalTool;
      repository?: /* Repository */ Repository;
      /**
       * GitLab details. Applicable if approvalTool is gitlab.
       */
      gitlab?: {
        pullRequest?: PullRequest;
      };
      /**
       * GitHub details. Applicable if approvalTool is git.
       */
      github?: {
        pullRequest?: PullRequest;
      };
      source /**
       * Import Source:
       *   * 'config' - Import from static catalog location configuration in 'app-config'
       *   * 'location' - Import of user registered entities using locations endpoint
       *   * 'integration' - Import using a GitHub integration
       *   * null - Import source is unknown
       *
       */?: Source;
    }
    /**
     * Import Job status
     */
    export type TaskImportStatus =
      | 'TASK_CANCELLED'
      | 'TASK_COMPLETED'
      | 'TASK_FAILED'
      | 'TASK_OPEN'
      | 'TASK_PROCESSING'
      | 'TASK_SKIPPED'
      | 'TASK_FETCH_FAILED';
  }
}
declare namespace Paths {
  namespace CreateImportJobs {
    namespace Parameters {
      export type DryRun = boolean;
    }
    export interface QueryParameters {
      dryRun?: Parameters.DryRun;
    }
    export type RequestBody =
      /* Import Job request */ Components.Schemas.ImportRequest[];
    namespace Responses {
      export type $202 = /* Import Job */ Components.Schemas.Import[];
    }
  }
  namespace CreateTaskImportJobs {
    export type RequestBody =
      /* Import Job request */ Components.Schemas.ImportRequest[];
    namespace Responses {
      export type $202 = /* Import Job */ Components.Schemas.Import[];
    }
  }
  namespace DeleteImportByRepo {
    namespace Parameters {
      export type ApprovalTool = string;
      export type DefaultBranch = string;
      export type Repo = string;
    }
    export interface QueryParameters {
      repo?: Parameters.Repo;
      defaultBranch?: Parameters.DefaultBranch;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export interface $204 {}
      export interface $500 {}
    }
  }
  namespace DeleteTaskImportByRepo {
    namespace Parameters {
      export type ApprovalTool = string;
      export type Repo = string;
    }
    export interface QueryParameters {
      repo?: Parameters.Repo;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export interface $204 {}
      export interface $500 {}
    }
  }
  namespace FindAllImports {
    export interface HeaderParameters {
      'api-version'?: Parameters.ApiVersion;
    }
    namespace Parameters {
      export type ApiVersion = 'v1' | 'v2';
      export type ApprovalTool = string;
      export type Page = number;
      export type PagePerIntegration = number;
      export type Search = string;
      export type Size = number;
      export type SizePerIntegration = number;
      export type SortColumn =
        | 'repository.name'
        | 'repository.organization'
        | 'repository.url'
        | 'lastUpdate'
        | 'status';
      export type SortOrder = 'asc' | 'desc';
    }
    export interface QueryParameters {
      pagePerIntegration?: Parameters.PagePerIntegration;
      sizePerIntegration?: Parameters.SizePerIntegration;
      page?: Parameters.Page;
      size?: Parameters.Size;
      sortOrder?: Parameters.SortOrder;
      sortColumn?: Parameters.SortColumn;
      search?: Parameters.Search;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export type $200 =
        /* Import Job with source it originates from */
        | Components.Schemas.SourceImport[]
        | /* Import Job List */ Components.Schemas.ImportJobListV2;
      export type $500 =
        | string
        | /* Import Job List */ Components.Schemas.ImportJobListV2;
    }
  }
  namespace FindAllOrganizations {
    namespace Parameters {
      export type ApprovalTool = string;
      export type PagePerIntegration = number;
      export type Search = string;
      export type SizePerIntegration = number;
    }
    export interface QueryParameters {
      pagePerIntegration?: Parameters.PagePerIntegration;
      sizePerIntegration?: Parameters.SizePerIntegration;
      search?: Parameters.Search;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export type $200 =
        /* Organization List */ Components.Schemas.OrganizationList;
      export type $500 =
        /* Organization List */ Components.Schemas.OrganizationList;
    }
  }
  namespace FindAllRepositories {
    namespace Parameters {
      export type ApprovalTool = string;
      export type CheckImportStatus = boolean;
      export type PagePerIntegration = number;
      export type Search = string;
      export type SizePerIntegration = number;
    }
    export interface QueryParameters {
      checkImportStatus?: Parameters.CheckImportStatus;
      pagePerIntegration?: Parameters.PagePerIntegration;
      sizePerIntegration?: Parameters.SizePerIntegration;
      search?: Parameters.Search;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export type $200 =
        /* Repository List */ Components.Schemas.RepositoryList;
      export type $500 =
        /* Repository List */ Components.Schemas.RepositoryList;
    }
  }
  namespace FindAllTaskImports {
    export interface HeaderParameters {
      'api-version'?: Parameters.ApiVersion;
    }
    namespace Parameters {
      export type ApiVersion = 'v1' | 'v2';
      export type Page = number;
      export type PagePerIntegration = number;
      export type Search = string;
      export type Size = number;
      export type SizePerIntegration = number;
      export type SortColumn =
        | 'repository.name'
        | 'repository.organization'
        | 'repository.url'
        | 'lastUpdate'
        | 'status';
      export type SortOrder = 'asc' | 'desc';
    }
    export interface QueryParameters {
      pagePerIntegration?: Parameters.PagePerIntegration;
      sizePerIntegration?: Parameters.SizePerIntegration;
      page?: Parameters.Page;
      size?: Parameters.Size;
      sortOrder?: Parameters.SortOrder;
      sortColumn?: Parameters.SortColumn;
      search?: Parameters.Search;
    }
    namespace Responses {
      export type $200 =
        /* Import Job with source it originates from */
        | Components.Schemas.SourceImport[]
        | /* Import Job List */ Components.Schemas.ImportJobListV2;
      export type $500 =
        | string
        | /* Import Job List */ Components.Schemas.ImportJobListV2;
    }
  }
  namespace FindImportStatusByRepo {
    namespace Parameters {
      export type ApprovalTool = string;
      export type DefaultBranch = string;
      export type Repo = string;
    }
    export interface QueryParameters {
      repo?: Parameters.Repo;
      defaultBranch?: Parameters.DefaultBranch;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export type $200 = /* Import Job */ Components.Schemas.Import;
      export interface $500 {}
    }
  }
  namespace FindRepositoriesByOrganization {
    namespace Parameters {
      export type ApprovalTool = string;
      export type CheckImportStatus = boolean;
      export type OrganizationName = string;
      export type PagePerIntegration = number;
      export type Search = string;
      export type SizePerIntegration = number;
    }
    export interface PathParameters {
      organizationName: Parameters.OrganizationName;
    }
    export interface QueryParameters {
      checkImportStatus?: Parameters.CheckImportStatus;
      pagePerIntegration?: Parameters.PagePerIntegration;
      sizePerIntegration?: Parameters.SizePerIntegration;
      search?: Parameters.Search;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export type $200 =
        /* Repository List */ Components.Schemas.RepositoryList;
      export type $500 =
        /* Repository List */ Components.Schemas.RepositoryList;
    }
  }
  namespace FindTaskImportStatusByRepo {
    namespace Parameters {
      export type ApprovalTool = string;
      export type DefaultBranch = string;
      export type Repo = string;
    }
    export interface QueryParameters {
      repo?: Parameters.Repo;
      defaultBranch?: Parameters.DefaultBranch;
      approvalTool?: Parameters.ApprovalTool;
    }
    namespace Responses {
      export type $200 = /* Import Job */ Components.Schemas.Import;
      export interface $500 {}
    }
  }
  namespace Ping {
    namespace Responses {
      export interface $200 {
        status?: 'ok';
      }
    }
  }
}

export interface OperationMethods {
  /**
   * ping - Check the health of the Bulk Import backend router
   */
  'ping'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.Ping.Responses.$200>;
  /**
   * findAllOrganizations - Fetch Organizations accessible by Backstage Github Integrations
   */
  'findAllOrganizations'(
    parameters?: Parameters<Paths.FindAllOrganizations.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindAllOrganizations.Responses.$200>;
  /**
   * findRepositoriesByOrganization - Fetch Repositories in the specified GitHub organization, provided it is accessible by any of the configured GitHub Integrations.
   */
  'findRepositoriesByOrganization'(
    parameters?: Parameters<
      Paths.FindRepositoriesByOrganization.QueryParameters &
        Paths.FindRepositoriesByOrganization.PathParameters
    > | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindRepositoriesByOrganization.Responses.$200>;
  /**
   * findAllRepositories - Fetch Organization Repositories accessible by Backstage Github Integrations
   */
  'findAllRepositories'(
    parameters?: Parameters<Paths.FindAllRepositories.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindAllRepositories.Responses.$200>;
  /**
   * findAllImports - Fetch Import Jobs
   */
  'findAllImports'(
    parameters?: Parameters<
      Paths.FindAllImports.QueryParameters &
        Paths.FindAllImports.HeaderParameters
    > | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindAllImports.Responses.$200>;
  /**
   * createImportJobs - Submit Import Jobs
   */
  'createImportJobs'(
    parameters?: Parameters<Paths.CreateImportJobs.QueryParameters> | null,
    data?: Paths.CreateImportJobs.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.CreateImportJobs.Responses.$202>;
  /**
   * findAllTaskImports - Fetch Import Jobs
   */
  'findAllTaskImports'(
    parameters?: Parameters<
      Paths.FindAllTaskImports.QueryParameters &
        Paths.FindAllTaskImports.HeaderParameters
    > | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindAllTaskImports.Responses.$200>;
  /**
   * createTaskImportJobs - Execute a scaffolder template for a list of repositories
   */
  'createTaskImportJobs'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.CreateTaskImportJobs.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.CreateTaskImportJobs.Responses.$202>;
  /**
   * findTaskImportStatusByRepo - Get Import Status by repository
   */
  'findTaskImportStatusByRepo'(
    parameters?: Parameters<Paths.FindTaskImportStatusByRepo.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindTaskImportStatusByRepo.Responses.$200>;
  /**
   * deleteTaskImportByRepo - Delete stored scaffolder task records for a specific repository
   */
  'deleteTaskImportByRepo'(
    parameters?: Parameters<Paths.DeleteTaskImportByRepo.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.DeleteTaskImportByRepo.Responses.$204>;
  /**
   * findImportStatusByRepo - Get Import Status by repository
   */
  'findImportStatusByRepo'(
    parameters?: Parameters<Paths.FindImportStatusByRepo.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.FindImportStatusByRepo.Responses.$200>;
  /**
   * deleteImportByRepo - Delete Import by repository
   */
  'deleteImportByRepo'(
    parameters?: Parameters<Paths.DeleteImportByRepo.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.DeleteImportByRepo.Responses.$204>;
}

export interface PathsDictionary {
  ['/ping']: {
    /**
     * ping - Check the health of the Bulk Import backend router
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.Ping.Responses.$200>;
  };
  ['/organizations']: {
    /**
     * findAllOrganizations - Fetch Organizations accessible by Backstage Github Integrations
     */
    'get'(
      parameters?: Parameters<Paths.FindAllOrganizations.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindAllOrganizations.Responses.$200>;
  };
  ['/organizations/{organizationName}/repositories']: {
    /**
     * findRepositoriesByOrganization - Fetch Repositories in the specified GitHub organization, provided it is accessible by any of the configured GitHub Integrations.
     */
    'get'(
      parameters?: Parameters<
        Paths.FindRepositoriesByOrganization.QueryParameters &
          Paths.FindRepositoriesByOrganization.PathParameters
      > | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindRepositoriesByOrganization.Responses.$200>;
  };
  ['/repositories']: {
    /**
     * findAllRepositories - Fetch Organization Repositories accessible by Backstage Github Integrations
     */
    'get'(
      parameters?: Parameters<Paths.FindAllRepositories.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindAllRepositories.Responses.$200>;
  };
  ['/imports']: {
    /**
     * findAllImports - Fetch Import Jobs
     */
    'get'(
      parameters?: Parameters<
        Paths.FindAllImports.QueryParameters &
          Paths.FindAllImports.HeaderParameters
      > | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindAllImports.Responses.$200>;
    /**
     * createImportJobs - Submit Import Jobs
     */
    'post'(
      parameters?: Parameters<Paths.CreateImportJobs.QueryParameters> | null,
      data?: Paths.CreateImportJobs.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.CreateImportJobs.Responses.$202>;
  };
  ['/task-imports']: {
    /**
     * findAllTaskImports - Fetch Import Jobs
     */
    'get'(
      parameters?: Parameters<
        Paths.FindAllTaskImports.QueryParameters &
          Paths.FindAllTaskImports.HeaderParameters
      > | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindAllTaskImports.Responses.$200>;
    /**
     * createTaskImportJobs - Execute a scaffolder template for a list of repositories
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.CreateTaskImportJobs.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.CreateTaskImportJobs.Responses.$202>;
  };
  ['/task-import/by-repo']: {
    /**
     * findTaskImportStatusByRepo - Get Import Status by repository
     */
    'get'(
      parameters?: Parameters<Paths.FindTaskImportStatusByRepo.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindTaskImportStatusByRepo.Responses.$200>;
    /**
     * deleteTaskImportByRepo - Delete stored scaffolder task records for a specific repository
     */
    'delete'(
      parameters?: Parameters<Paths.DeleteTaskImportByRepo.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.DeleteTaskImportByRepo.Responses.$204>;
  };
  ['/import/by-repo']: {
    /**
     * findImportStatusByRepo - Get Import Status by repository
     */
    'get'(
      parameters?: Parameters<Paths.FindImportStatusByRepo.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.FindImportStatusByRepo.Responses.$200>;
    /**
     * deleteImportByRepo - Delete Import by repository
     */
    'delete'(
      parameters?: Parameters<Paths.DeleteImportByRepo.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.DeleteImportByRepo.Responses.$204>;
  };
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>;

export type ApprovalTool = Components.Schemas.ApprovalTool;
export type Import = Components.Schemas.Import;
export type ImportJobListV2 = Components.Schemas.ImportJobListV2;
export type ImportRequest = Components.Schemas.ImportRequest;
export type ImportStatus = Components.Schemas.ImportStatus;
export type Organization = Components.Schemas.Organization;
export type OrganizationList = Components.Schemas.OrganizationList;
export type PullRequest = Components.Schemas.PullRequest;
export type Repository = Components.Schemas.Repository;
export type RepositoryList = Components.Schemas.RepositoryList;
export type ScaffolderTask = Components.Schemas.ScaffolderTask;
export type Source = Components.Schemas.Source;
export type SourceImport = Components.Schemas.SourceImport;
export type TaskImportStatus = Components.Schemas.TaskImportStatus;
