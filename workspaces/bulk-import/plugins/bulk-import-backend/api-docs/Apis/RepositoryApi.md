# RepositoryApi

All URIs are relative to *http://localhost:7007/api/bulk-import*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**findAllRepositories**](RepositoryApi.md#findAllRepositories) | **GET** /repositories | Fetch Organization Repositories accessible by Backstage Github Integrations |


<a name="findAllRepositories"></a>
# **findAllRepositories**
> RepositoryList findAllRepositories(checkImportStatus, pagePerIntegration, sizePerIntegration, search, approvalTool, x-scm-tokens)

Fetch Organization Repositories accessible by Backstage Github Integrations

### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **checkImportStatus** | **Boolean**| whether to return import status. Note that this might incur a performance penalty because the import status is computed for each repository. | [optional] [default to false] |
| **pagePerIntegration** | **Integer**| the page number for each Integration | [optional] [default to 1] |
| **sizePerIntegration** | **Integer**| the number of items per Integration to return per page | [optional] [default to 20] |
| **search** | **String**| returns only the items that match the search string | [optional] [default to null] |
| **approvalTool** | **String**| the approvalTool to use | [optional] [default to GIT] |
| **x-scm-tokens** | **String**| **Required.** JSON-encoded map of SCM host URL to user OAuth token. Used to fetch repositories on behalf of the signed-in user. The value must be a JSON object whose keys are SCM integration base URLs and whose values are OAuth bearer tokens (e.g. `{"https://github.com":"ghp_xxx"}`). Requests that omit this header, supply an empty object, or exceed 4 KB are rejected with HTTP 401.  | [required] [default to null] |

### Return type

[**RepositoryList**](../Models/RepositoryList.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

