# PluginsApi

All URIs are relative to _http://localhost:7007/api/extensions_

| Method                                                                         | HTTP request                                               | Description                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------- |
| [**disablePlugin**](PluginsApi.md#disablePlugin)                               | **PATCH** /plugin/{namespace}/{name}/configuration/disable | Disable or enable a plugin                        |
| [**getExtensionsConfiguration**](PluginsApi.md#getExtensionsConfiguration)     | **GET** /plugins/configure                                 | Check if plugin installation is enabled           |
| [**getPluginConfigAuthorization**](PluginsApi.md#getPluginConfigAuthorization) | **GET** /plugin/{namespace}/{name}/configuration/authorize | Check plugin authorization for read/write actions |
| [**getPluginConfigByName**](PluginsApi.md#getPluginConfigByName)               | **GET** /plugin/{namespace}/{name}/configuration           | Get plugin configuration YAML                     |
| [**getPluginPackages**](PluginsApi.md#getPluginPackages)                       | **GET** /plugin/{namespace}/{name}/packages                | Get packages associated with a plugin             |
| [**getPlugins**](PluginsApi.md#getPlugins)                                     | **GET** /plugins                                           | List available plugins                            |
| [**installPlugin**](PluginsApi.md#installPlugin)                               | **POST** /plugin/{namespace}/{name}/configuration          | Install or update plugin configuration            |

<a name="disablePlugin"></a>

# **disablePlugin**

> PluginConfigurationStatusResponse disablePlugin(namespace, name, PluginDisableRequest)

Disable or enable a plugin

### Parameters

| Name                     | Type                                                          | Description | Notes                |
| ------------------------ | ------------------------------------------------------------- | ----------- | -------------------- |
| **namespace**            | **String**                                                    |             | [default to default] |
| **name**                 | **String**                                                    |             | [default to null]    |
| **PluginDisableRequest** | [**PluginDisableRequest**](../Models/PluginDisableRequest.md) |             |                      |

### Return type

[**PluginConfigurationStatusResponse**](../Models/PluginConfigurationStatusResponse.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="getExtensionsConfiguration"></a>

# **getExtensionsConfiguration**

> PluginInstallationConfigResponse getExtensionsConfiguration()

Check if plugin installation is enabled

### Parameters

This endpoint does not need any parameter.

### Return type

[**PluginInstallationConfigResponse**](../Models/PluginInstallationConfigResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="getPluginConfigAuthorization"></a>

# **getPluginConfigAuthorization**

> PluginAuthorizationResponse getPluginConfigAuthorization(namespace, name)

Check plugin authorization for read/write actions

### Parameters

| Name          | Type       | Description             | Notes                |
| ------------- | ---------- | ----------------------- | -------------------- |
| **namespace** | **String** | Namespace of the plugin | [default to default] |
| **name**      | **String** | Name of the plugin      | [default to null]    |

### Return type

[**PluginAuthorizationResponse**](../Models/PluginAuthorizationResponse.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="getPluginConfigByName"></a>

# **getPluginConfigByName**

> PluginConfigurationResponse getPluginConfigByName(namespace, name)

Get plugin configuration YAML

### Parameters

| Name          | Type       | Description | Notes                |
| ------------- | ---------- | ----------- | -------------------- |
| **namespace** | **String** |             | [default to default] |
| **name**      | **String** |             | [default to null]    |

### Return type

[**PluginConfigurationResponse**](../Models/PluginConfigurationResponse.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="getPluginPackages"></a>

# **getPluginPackages**

> List getPluginPackages(namespace, name)

Get packages associated with a plugin

### Parameters

| Name          | Type       | Description      | Notes                |
| ------------- | ---------- | ---------------- | -------------------- |
| **namespace** | **String** | Plugin namespace | [default to default] |
| **name**      | **String** | Plugin name      | [default to null]    |

### Return type

**List**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="getPlugins"></a>

# **getPlugins**

> getPlugins_200_response getPlugins(filter, limit, offset)

List available plugins

### Parameters

| Name       | Type        | Description               | Notes                        |
| ---------- | ----------- | ------------------------- | ---------------------------- |
| **filter** | **String**  | Filter query for plugins  | [optional] [default to null] |
| **limit**  | **Integer** | Number of items to return | [optional] [default to null] |
| **offset** | **Integer** | Pagination offset         | [optional] [default to null] |

### Return type

[**getPlugins_200_response**](../Models/getPlugins_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="installPlugin"></a>

# **installPlugin**

> PluginConfigurationStatusResponse installPlugin(namespace, name, installPlugin_request)

Install or update plugin configuration

### Parameters

| Name                      | Type                                                            | Description | Notes                |
| ------------------------- | --------------------------------------------------------------- | ----------- | -------------------- |
| **namespace**             | **String**                                                      |             | [default to default] |
| **name**                  | **String**                                                      |             | [default to null]    |
| **installPlugin_request** | [**installPlugin_request**](../Models/installPlugin_request.md) |             |                      |

### Return type

[**PluginConfigurationStatusResponse**](../Models/PluginConfigurationStatusResponse.md)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json
