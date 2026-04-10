# ManagementApi

All URIs are relative to *http://localhost:7007/api/bulk-import*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**findAllSCMHosts**](ManagementApi.md#findAllSCMHosts) | **GET** /scm-hosts | Retrieve the SCM Integration hosts |
| [**ping**](ManagementApi.md#ping) | **GET** /ping | Check the health of the Bulk Import backend router |


<a name="findAllSCMHosts"></a>
# **findAllSCMHosts**
> SCMHostList findAllSCMHosts()

Retrieve the SCM Integration hosts

### Parameters
This endpoint does not need any parameter.

### Return type

[**SCMHostList**](../Models/SCMHostList.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="ping"></a>
# **ping**
> ping_200_response ping()

Check the health of the Bulk Import backend router

### Parameters
This endpoint does not need any parameter.

### Return type

[**ping_200_response**](../Models/ping_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

