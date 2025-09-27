# RepositoryApi

All URIs are relative to _http://localhost:7007/api/bulk-import_

| Method                                                                | HTTP request                    | Description                                                                 |
| --------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| [**deleteTaskImportByRepo**](RepositoryApi.md#deleteTaskImportByRepo) | **DELETE** /task-import/by-repo | Delete task import by repository name                                       |
| [**findAllRepositories**](RepositoryApi.md#findAllRepositories)       | **GET** /repositories           | Fetch Organization Repositories accessible by Backstage Github Integrations |

<a name="deleteTaskImportByRepo"></a>

# **deleteTaskImportByRepo**

> deleteTaskImportByRepo(repo)

Delete task import by repository name

### Parameters

| Name     | Type       | Description              | Notes                        |
| -------- | ---------- | ------------------------ | ---------------------------- |
| **repo** | **String** | the full URL to the repo | [optional] [default to null] |

### Return type

null (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

<a name="findAllRepositories"></a>

# **findAllRepositories**

> RepositoryList findAllRepositories(checkImportStatus, pagePerIntegration, sizePerIntegration, search, approvalTool)

Fetch Organization Repositories accessible by Backstage Github Integrations

### Parameters

| Name                   | Type        | Description                                                                                                                                  | Notes                         |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **checkImportStatus**  | **Boolean** | whether to return import status. Note that this might incur a performance penalty because the import status is computed for each repository. | [optional] [default to false] |
| **pagePerIntegration** | **Integer** | the page number for each Integration                                                                                                         | [optional] [default to 1]     |
| **sizePerIntegration** | **Integer** | the number of items per Integration to return per page                                                                                       | [optional] [default to 20]    |
| **search**             | **String**  | returns only the items that match the search string                                                                                          | [optional] [default to null]  |
| **approvalTool**       | **String**  | the approvalTool to use                                                                                                                      | [optional] [default to GIT]   |

### Return type

[**RepositoryList**](../Models/RepositoryList.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json
