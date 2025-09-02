# Documentation for Bulk Import Backend

<a name="documentation-for-api-endpoints"></a>

## Documentation for API Endpoints

All URIs are relative to _http://localhost:7007/api/bulk-import_

| Class             | Method                                                                                       | HTTP request                                           | Description                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| _ImportApi_       | [**createImportJobs**](Apis/ImportApi.md#createimportjobs)                                   | **POST** /imports                                      | Submit Import Jobs                                                                                                               |
| _ImportApi_       | [**deleteImportByRepo**](Apis/ImportApi.md#deleteimportbyrepo)                               | **DELETE** /import/by-repo                             | Delete Import by repository                                                                                                      |
| _ImportApi_       | [**findAllImports**](Apis/ImportApi.md#findallimports)                                       | **GET** /imports                                       | Fetch Import Jobs                                                                                                                |
| _ImportApi_       | [**findImportStatusByRepo**](Apis/ImportApi.md#findimportstatusbyrepo)                       | **GET** /import/by-repo                                | Get Import Status by repository                                                                                                  |
| _ManagementApi_   | [**ping**](Apis/ManagementApi.md#ping)                                                       | **GET** /ping                                          | Check the health of the Bulk Import backend router                                                                               |
| _OrganizationApi_ | [**findAllOrganizations**](Apis/OrganizationApi.md#findallorganizations)                     | **GET** /organizations                                 | Fetch Organizations accessible by Backstage Github Integrations                                                                  |
| _OrganizationApi_ | [**findRepositoriesByOrganization**](Apis/OrganizationApi.md#findrepositoriesbyorganization) | **GET** /organizations/{organizationName}/repositories | Fetch Repositories in the specified GitHub organization, provided it is accessible by any of the configured GitHub Integrations. |
| _RepositoryApi_   | [**findAllRepositories**](Apis/RepositoryApi.md#findallrepositories)                         | **GET** /repositories                                  | Fetch Organization Repositories accessible by Backstage Github Integrations                                                      |

<a name="documentation-for-models"></a>

## Documentation for Models

- [ApprovalTool](./Models/ApprovalTool.md)
- [Import](./Models/Import.md)
- [ImportJobListV2](./Models/ImportJobListV2.md)
- [ImportRequest](./Models/ImportRequest.md)
- [ImportRequest_github](./Models/ImportRequest_github.md)
- [ImportRequest_github_pullRequest](./Models/ImportRequest_github_pullRequest.md)
- [ImportRequest_gitlab](./Models/ImportRequest_gitlab.md)
- [ImportRequest_gitlab_pullRequest](./Models/ImportRequest_gitlab_pullRequest.md)
- [ImportRequest_repository](./Models/ImportRequest_repository.md)
- [ImportStatus](./Models/ImportStatus.md)
- [Import_github](./Models/Import_github.md)
- [Import_github_pullRequest](./Models/Import_github_pullRequest.md)
- [Import_gitlab](./Models/Import_gitlab.md)
- [Import_gitlab_pullRequest](./Models/Import_gitlab_pullRequest.md)
- [Organization](./Models/Organization.md)
- [OrganizationList](./Models/OrganizationList.md)
- [Repository](./Models/Repository.md)
- [RepositoryList](./Models/RepositoryList.md)
- [Source](./Models/Source.md)
- [SourceImport](./Models/SourceImport.md)
- [findAllImports_200_response](./Models/findAllImports_200_response.md)
- [findAllImports_500_response](./Models/findAllImports_500_response.md)
- [ping_200_response](./Models/ping_200_response.md)

<a name="documentation-for-authorization"></a>

## Documentation for Authorization

<a name="BearerAuth"></a>

### BearerAuth

- **Type**: HTTP Bearer Token authentication (JWT)
