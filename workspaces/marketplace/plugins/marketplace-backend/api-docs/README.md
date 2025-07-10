# Documentation for Extension Backend

<a name="documentation-for-api-endpoints"></a>

## Documentation for API Endpoints

All URIs are relative to _http://localhost:7007/api/extensions_

| Class        | Method                                                                              | HTTP request                                               | Description                                       |
| ------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| _PluginsApi_ | [**disablePlugin**](Apis/PluginsApi.md#disableplugin)                               | **PATCH** /plugin/{namespace}/{name}/configuration/disable | Disable or enable a plugin                        |
| _PluginsApi_ | [**getExtensionsConfiguration**](Apis/PluginsApi.md#getextensionsconfiguration)     | **GET** /plugins/configure                                 | Check if plugin installation is enabled           |
| _PluginsApi_ | [**getPluginConfigAuthorization**](Apis/PluginsApi.md#getpluginconfigauthorization) | **GET** /plugin/{namespace}/{name}/configuration/authorize | Check plugin authorization for read/write actions |
| _PluginsApi_ | [**getPluginConfigByName**](Apis/PluginsApi.md#getpluginconfigbyname)               | **GET** /plugin/{namespace}/{name}/configuration           | Get plugin configuration YAML                     |
| _PluginsApi_ | [**getPluginPackages**](Apis/PluginsApi.md#getpluginpackages)                       | **GET** /plugin/{namespace}/{name}/packages                | Get packages associated with a plugin             |
| _PluginsApi_ | [**getPlugins**](Apis/PluginsApi.md#getplugins)                                     | **GET** /plugins                                           | List available plugins                            |
| _PluginsApi_ | [**installPlugin**](Apis/PluginsApi.md#installplugin)                               | **POST** /plugin/{namespace}/{name}/configuration          | Install or update plugin configuration            |
| _SystemApi_  | [**getNodeEnvironment**](Apis/SystemApi.md#getnodeenvironment)                      | **GET** /environment                                       | Get the current Node environment                  |

<a name="documentation-for-models"></a>

## Documentation for Models

- [Plugin](./Models/Plugin.md)
- [PluginAuthorizationResponse](./Models/PluginAuthorizationResponse.md)
- [PluginConfigurationResponse](./Models/PluginConfigurationResponse.md)
- [PluginConfigurationStatusResponse](./Models/PluginConfigurationStatusResponse.md)
- [PluginDisableRequest](./Models/PluginDisableRequest.md)
- [PluginInstallationConfigResponse](./Models/PluginInstallationConfigResponse.md)
- [Plugin_metadata](./Models/Plugin_metadata.md)
- [Plugin_relations_inner](./Models/Plugin_relations_inner.md)
- [Plugin_spec](./Models/Plugin_spec.md)
- [Plugin_spec_authors_inner](./Models/Plugin_spec_authors_inner.md)
- [getNodeEnvironment_200_response](./Models/getNodeEnvironment_200_response.md)
- [getPlugins_200_response](./Models/getPlugins_200_response.md)
- [installPlugin_request](./Models/installPlugin_request.md)

<a name="documentation-for-authorization"></a>

## Documentation for Authorization

<a name="BearerAuth"></a>

### BearerAuth

- **Type**: HTTP Bearer Token authentication (JWT)
