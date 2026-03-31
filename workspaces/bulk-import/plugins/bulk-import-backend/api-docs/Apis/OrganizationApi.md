# OrganizationApi

All URIs are relative to *http://localhost:7007/api/bulk-import*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**findAllOrganizations**](OrganizationApi.md#findAllOrganizations) | **GET** /organizations | Fetch Organizations accessible by Backstage Github Integrations |
| [**findRepositoriesByOrganization**](OrganizationApi.md#findRepositoriesByOrganization) | **GET** /organizations/{organizationName}/repositories | Fetch Repositories in the specified GitHub organization, provided it is accessible by any of the configured GitHub Integrations. |


<a name="findAllOrganizations"></a>
# **findAllOrganizations**
> OrganizationList findAllOrganizations(pagePerIntegration, sizePerIntegration, search, approvalTool)

Fetch Organizations accessible by Backstage Github Integrations

### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **pagePerIntegration** | **Integer**| the page number for each Integration | [optional] [default to 1] |
| **sizePerIntegration** | **Integer**| the number of items per Integration to return per page | [optional] [default to 20] |
| **search** | **String**| returns only the items that match the search string | [optional] [default to null] |
| **approvalTool** | **String**| the approvalTool to use | [optional] [default to GIT] |

### Return type

[**OrganizationList**](../Models/OrganizationList.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="findRepositoriesByOrganization"></a>
# **findRepositoriesByOrganization**
> RepositoryList findRepositoriesByOrganization(organizationName, checkImportStatus, pagePerIntegration, sizePerIntegration, search, approvalTool, x-scm-tokens)

Fetch Repositories in the specified GitHub organization, provided it is accessible by any of the configured GitHub Integrations.

### Parameters

|Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **organizationName** | **String**| Organization name | [default to null] |
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

