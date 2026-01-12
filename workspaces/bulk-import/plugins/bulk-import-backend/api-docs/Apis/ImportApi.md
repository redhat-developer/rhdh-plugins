# ImportApi

All URIs are relative to _http://localhost:7007/api/bulk-import_

| Method                                                                    | HTTP request                    | Description                                                     |
| ------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| [**createImportJobs**](ImportApi.md#createImportJobs)                     | **POST** /imports               | Submit Import Jobs                                              |
| [**createTaskImportJobs**](ImportApi.md#createTaskImportJobs)             | **POST** /task-imports          | Execute a scaffolder template for a list of repositories        |
| [**deleteImportByRepo**](ImportApi.md#deleteImportByRepo)                 | **DELETE** /import/by-repo      | Delete Import by repository                                     |
| [**deleteTaskImportByRepo**](ImportApi.md#deleteTaskImportByRepo)         | **DELETE** /task-import/by-repo | Delete stored scaffolder task records for a specific repository |
| [**findAllImports**](ImportApi.md#findAllImports)                         | **GET** /imports                | Fetch Import Jobs                                               |
| [**findAllTaskImports**](ImportApi.md#findAllTaskImports)                 | **GET** /task-imports           | Fetch Import Jobs                                               |
| [**findImportStatusByRepo**](ImportApi.md#findImportStatusByRepo)         | **GET** /import/by-repo         | Get Import Status by repository                                 |
| [**findTaskImportStatusByRepo**](ImportApi.md#findTaskImportStatusByRepo) | **GET** /task-import/by-repo    | Get Import Status by repository                                 |

<a name="createImportJobs"></a>

# **createImportJobs**

> List createImportJobs(ImportRequest, dryRun)

Submit Import Jobs

### Parameters

| Name              | Type                                   | Description                                                                                | Notes                         |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| **ImportRequest** | [**List**](../Models/ImportRequest.md) | List of Import jobs to create                                                              |                               |
| **dryRun**        | **Boolean**                            | whether to perform a dry-run to check if entity name collisions would occur in the catalog | [optional] [default to false] |

### Return type

[**List**](../Models/Import.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="createTaskImportJobs"></a>

# **createTaskImportJobs**

> List createTaskImportJobs(ImportRequest)

Execute a scaffolder template for a list of repositories

### Parameters

| Name              | Type                                   | Description                                                     | Notes |
| ----------------- | -------------------------------------- | --------------------------------------------------------------- | ----- |
| **ImportRequest** | [**List**](../Models/ImportRequest.md) | The template to execute and the repositories to run it against. |       |

### Return type

[**List**](../Models/Import.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="deleteImportByRepo"></a>

# **deleteImportByRepo**

> deleteImportByRepo(repo, defaultBranch, approvalTool)

Delete Import by repository

### Parameters

| Name              | Type       | Description                    | Notes                        |
| ----------------- | ---------- | ------------------------------ | ---------------------------- |
| **repo**          | **String** | the full URL to the repo       | [optional] [default to null] |
| **defaultBranch** | **String** | the name of the default branch | [optional] [default to main] |
| **approvalTool**  | **String** | the approvalTool to use        | [optional] [default to GIT]  |

### Return type

null (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

<a name="deleteTaskImportByRepo"></a>

# **deleteTaskImportByRepo**

> deleteTaskImportByRepo(repo, approvalTool)

Delete stored scaffolder task records for a specific repository

### Parameters

| Name             | Type       | Description              | Notes                        |
| ---------------- | ---------- | ------------------------ | ---------------------------- |
| **repo**         | **String** | the full URL to the repo | [optional] [default to null] |
| **approvalTool** | **String** | the approvalTool to use  | [optional] [default to GIT]  |

### Return type

null (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

<a name="findAllImports"></a>

# **findAllImports**

> findAllImports_200_response findAllImports(api-version, pagePerIntegration, sizePerIntegration, page, size, sortOrder, sortColumn, search, approvalTool)

Fetch Import Jobs

### Parameters

| Name                   | Type        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                                                                                                        |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **api-version**        | **String**  | API version. ## Changelog ### v1 (default) Initial version #### Deprecations _ GET /imports _ Deprecation of &#39;pagePerIntegration&#39; and &#39;sizePerIntegration&#39; query parameters and introduction of new &#39;page&#39; and &#39;size&#39; parameters _ &#39;page&#39; takes precedence over &#39;pagePerIntegration&#39; if both are passed _ &#39;size&#39; takes precedence over &#39;sizePerIntegration&#39; if both are passed ### v2 #### Breaking changes _ GET /imports _ Query parameters: _ &#39;pagePerIntegration&#39; is ignored in favor of &#39;page&#39; _ &#39;sizePerIntegration&#39; is ignored in favor of &#39;size&#39; _ Response structure changed to include pagination info: instead of returning a simple list of Imports, the response is now an object containing the following fields: _ &#39;imports&#39;: the list of Imports _ &#39;page&#39;: the page requested _ &#39;size&#39;: the requested number of Imports requested per page \* &#39;totalCount&#39;: the total count of Imports | [optional] [default to v1] [enum: v1, v2]                                                                                    |
| **pagePerIntegration** | **Integer** | the page number for each Integration. **Deprecated**. Use the &#39;page&#39; query parameter instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | [optional] [default to 1]                                                                                                    |
| **sizePerIntegration** | **Integer** | the number of items per Integration to return per page. **Deprecated**. Use the &#39;size&#39; query parameter instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | [optional] [default to 20]                                                                                                   |
| **page**               | **Integer** | the requested page number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | [optional] [default to 1]                                                                                                    |
| **size**               | **Integer** | the number of items to return per page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [optional] [default to 20]                                                                                                   |
| **sortOrder**          | **String**  | The order of sorting asc for ascending or desc for descending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | [optional] [default to asc] [enum: asc, desc]                                                                                |
| **sortColumn**         | **String**  | The allowed values for sorting columns: - repository.name: Sort by repository name. - repository.organization: Sort by organization URL. - repository.url: Sort by repository URL. - lastUpdate: Sort by the last time the catalog-info.yaml was updated. - status: Sort by the status of the catalog-info.yaml.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [optional] [default to repository.name] [enum: repository.name, repository.organization, repository.url, lastUpdate, status] |
| **search**             | **String**  | returns only the items that match the search string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | [optional] [default to null]                                                                                                 |
| **approvalTool**       | **String**  | the approvalTool to use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | [optional] [default to GIT]                                                                                                  |

### Return type

[**findAllImports_200_response**](../Models/findAllImports_200_response.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="findAllTaskImports"></a>

# **findAllTaskImports**

> findAllImports_200_response findAllTaskImports(api-version, pagePerIntegration, sizePerIntegration, page, size, sortOrder, sortColumn, search)

Fetch Import Jobs

### Parameters

| Name                   | Type        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                                                                                                        |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **api-version**        | **String**  | API version. ## Changelog ### v1 (default) Initial version #### Deprecations _ GET /imports _ Deprecation of &#39;pagePerIntegration&#39; and &#39;sizePerIntegration&#39; query parameters and introduction of new &#39;page&#39; and &#39;size&#39; parameters _ &#39;page&#39; takes precedence over &#39;pagePerIntegration&#39; if both are passed _ &#39;size&#39; takes precedence over &#39;sizePerIntegration&#39; if both are passed ### v2 #### Breaking changes _ GET /imports _ Query parameters: _ &#39;pagePerIntegration&#39; is ignored in favor of &#39;page&#39; _ &#39;sizePerIntegration&#39; is ignored in favor of &#39;size&#39; _ Response structure changed to include pagination info: instead of returning a simple list of Imports, the response is now an object containing the following fields: _ &#39;imports&#39;: the list of Imports _ &#39;page&#39;: the page requested _ &#39;size&#39;: the requested number of Imports requested per page \* &#39;totalCount&#39;: the total count of Imports | [optional] [default to v1] [enum: v1, v2]                                                                                    |
| **pagePerIntegration** | **Integer** | the page number for each Integration. **Deprecated**. Use the &#39;page&#39; query parameter instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | [optional] [default to 1]                                                                                                    |
| **sizePerIntegration** | **Integer** | the number of items per Integration to return per page. **Deprecated**. Use the &#39;size&#39; query parameter instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | [optional] [default to 20]                                                                                                   |
| **page**               | **Integer** | the requested page number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | [optional] [default to 1]                                                                                                    |
| **size**               | **Integer** | the number of items to return per page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [optional] [default to 20]                                                                                                   |
| **sortOrder**          | **String**  | The order of sorting asc for ascending or desc for descending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | [optional] [default to asc] [enum: asc, desc]                                                                                |
| **sortColumn**         | **String**  | The allowed values for sorting columns: - repository.name: Sort by repository name. - repository.organization: Sort by organization URL. - repository.url: Sort by repository URL. - lastUpdate: Sort by the last time the catalog-info.yaml was updated. - status: Sort by the status of the catalog-info.yaml.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [optional] [default to repository.name] [enum: repository.name, repository.organization, repository.url, lastUpdate, status] |
| **search**             | **String**  | returns only the items that match the search string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | [optional] [default to null]                                                                                                 |

### Return type

[**findAllImports_200_response**](../Models/findAllImports_200_response.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="findImportStatusByRepo"></a>

# **findImportStatusByRepo**

> Import findImportStatusByRepo(repo, defaultBranch, approvalTool)

Get Import Status by repository

### Parameters

| Name              | Type       | Description                    | Notes                        |
| ----------------- | ---------- | ------------------------------ | ---------------------------- |
| **repo**          | **String** | the full URL to the repo       | [optional] [default to null] |
| **defaultBranch** | **String** | the name of the default branch | [optional] [default to main] |
| **approvalTool**  | **String** | the approvalTool to use        | [optional] [default to GIT]  |

### Return type

[**Import**](../Models/Import.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="findTaskImportStatusByRepo"></a>

# **findTaskImportStatusByRepo**

> Import findTaskImportStatusByRepo(repo, defaultBranch, approvalTool)

Get Import Status by repository

### Parameters

| Name              | Type       | Description                    | Notes                        |
| ----------------- | ---------- | ------------------------------ | ---------------------------- |
| **repo**          | **String** | the full URL to the repo       | [optional] [default to null] |
| **defaultBranch** | **String** | the name of the default branch | [optional] [default to main] |
| **approvalTool**  | **String** | the approvalTool to use        | [optional] [default to GIT]  |

### Return type

[**Import**](../Models/Import.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json
