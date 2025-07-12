# Documentation for Extension Backend

<a name="documentation-for-api-endpoints"></a>
## Documentation for API Endpoints

All URIs are relative to *http://localhost:7007/api/extensions*

| Class | Method | HTTP request | Description |
|------------ | ------------- | ------------- | -------------|
| *PluginsApi* | [**disablePlugin**](Apis/PluginsApi.md#disableplugin) | **PATCH** /plugin/{namespace}/{name}/configuration/disable | Disable or enable a plugin |
*PluginsApi* | [**getExtensionsConfiguration**](Apis/PluginsApi.md#getextensionsconfiguration) | **GET** /plugins/configure | Check if plugin installation is enabled |
*PluginsApi* | [**getPluginConfigAuthorization**](Apis/PluginsApi.md#getpluginconfigauthorization) | **GET** /plugin/{namespace}/{name}/configuration/authorize | Check plugin authorization for read/write actions |
*PluginsApi* | [**getPluginConfigByName**](Apis/PluginsApi.md#getpluginconfigbyname) | **GET** /plugin/{namespace}/{name}/configuration | Get plugin configuration YAML |
*PluginsApi* | [**getPluginPackages**](Apis/PluginsApi.md#getpluginpackages) | **GET** /plugin/{namespace}/{name}/packages | Get packages associated with a plugin |
*PluginsApi* | [**getPlugins**](Apis/PluginsApi.md#getplugins) | **GET** /plugins | List available plugins |
*PluginsApi* | [**installPlugin**](Apis/PluginsApi.md#installplugin) | **POST** /plugin/{namespace}/{name}/configuration | Install or update plugin configuration |
| *SystemApi* | [**getNodeEnvironment**](Apis/SystemApi.md#getnodeenvironment) | **GET** /environment | Get the current Node environment |


<a name="documentation-for-models"></a>
## Documentation for Models

 - [InstallPluginConfigurationRequest](./Models/InstallPluginConfigurationRequest.md)
 - [InstallPluginConfigurationStatusResponse](./Models/InstallPluginConfigurationStatusResponse.md)
 - [Plugin](./Models/Plugin.md)
 - [PluginAuthorizationResponse](./Models/PluginAuthorizationResponse.md)
 - [PluginConfigurationResponse](./Models/PluginConfigurationResponse.md)
 - [PluginConfigurationStatusResponse](./Models/PluginConfigurationStatusResponse.md)
 - [PluginDisableRequest](./Models/PluginDisableRequest.md)
 - [PluginInstallationConfigResponse](./Models/PluginInstallationConfigResponse.md)
 - [PluginPackage](./Models/PluginPackage.md)
 - [PluginPackage_metadata](./Models/PluginPackage_metadata.md)
 - [PluginPackage_metadata_links_inner](./Models/PluginPackage_metadata_links_inner.md)
 - [PluginPackage_relations_inner](./Models/PluginPackage_relations_inner.md)
 - [PluginPackage_spec](./Models/PluginPackage_spec.md)
 - [PluginPackage_spec_appConfigExamples_inner](./Models/PluginPackage_spec_appConfigExamples_inner.md)
 - [PluginPackage_spec_backstage](./Models/PluginPackage_spec_backstage.md)
 - [Plugin_metadata](./Models/Plugin_metadata.md)
 - [Plugin_relations_inner](./Models/Plugin_relations_inner.md)
 - [Plugin_spec](./Models/Plugin_spec.md)
 - [Plugin_spec_authors_inner](./Models/Plugin_spec_authors_inner.md)
 - [getNodeEnvironment_200_response](./Models/getNodeEnvironment_200_response.md)
 - [getPlugins_200_response](./Models/getPlugins_200_response.md)


<a name="documentation-for-authorization"></a>
## Documentation for Authorization

<a name="BearerAuth"></a>
### BearerAuth

- **Type**: HTTP Bearer Token authentication (JWT)

