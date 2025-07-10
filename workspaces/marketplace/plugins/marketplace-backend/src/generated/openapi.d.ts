/*
 * Copyright The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// eslint-disable
// prettier-ignore
import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios';

declare namespace Components {
  namespace Schemas {
    export interface Plugin {
      metadata?: {
        annotations?: {
          [name: string]: string;
        };
        /**
         * example:
         * marketplace-plugin-demo
         */
        namespace?: string;
        /**
         * example:
         * 3scale
         */
        name?: string;
        /**
         * example:
         * APIs with 3scale
         */
        title?: string;
        /**
         * example:
         * Synchronize 3scale content into the Backstage catalog.
         */
        description?: string;
        tags?: string[];
        /**
         * example:
         * 9f94bfb5-4a70-4a7a-b56c-9a5cb8ac18f2
         */
        uid?: string; // uuid
        /**
         * example:
         * 0cb7607f982608c01e424e951694f8b22632daf5
         */
        etag?: string;
      };
      /**
       * example:
       * extensions.backstage.io/v1alpha1
       */
      apiVersion?: string;
      /**
       * example:
       * Plugin
       */
      kind?: string;
      spec?: {
        /**
         * example:
         * https://janus-idp.io/images/plugins/3scale.svg
         */
        icon?: string; // uri
        categories?: string[];
        highlights?: string[];
        /**
         * example:
         * asd
         */
        support?: string;
        /**
         * example:
         * production
         */
        lifecycle?: string;
        packages?: string[];
        /**
         * example:
         * NotInstalled
         */
        installStatus?:
          | 'Installed'
          | 'NotInstalled'
          | 'UpdateAvailable'
          | 'Disabled';
        authors?: {
          name?: string;
        }[];
      };
      relations?: {
        /**
         * example:
         * hasPart
         */
        type?: string;
        /**
         * example:
         * package:marketplace-plugin-demo/backstage-community-plugin-3scale-backend
         */
        targetRef?: string;
      }[];
    }
    export interface PluginAuthorizationResponse {
      /**
       * example:
       * ALLOW
       */
      read: 'ALLOW' | 'DENY';
      /**
       * example:
       * DENY
       */
      write: 'ALLOW' | 'DENY';
    }
    export interface PluginConfigurationResponse {
      /**
       * YAML configuration content as a plain string
       * example:
       * - package: ./dynamic-plugins/dist/backstage-community-plugin-3scale-backend-dynamic
       *   disabled: false
       *
       */
      configYaml?: string;
    }
    export interface PluginConfigurationStatusResponse {
      /**
       * example:
       * OK
       */
      status?: string;
    }
    export interface PluginDisableRequest {
      /**
       * example:
       * true
       */
      disabled: boolean;
    }
    export interface PluginInstallationConfigResponse {
      /**
       * example:
       * true
       */
      enabled?: boolean;
    }
    export type PluginPackageListResponse = string[];
  }
}
declare namespace Paths {
  namespace DisablePlugin {
    namespace Parameters {
      export type Name = string;
      export type Namespace = string;
    }
    export interface PathParameters {
      namespace: Parameters.Namespace;
      name: Parameters.Name;
    }
    export type RequestBody = Components.Schemas.PluginDisableRequest;
    namespace Responses {
      export type $200 = Components.Schemas.PluginConfigurationStatusResponse;
      export interface $400 {}
      export interface $401 {}
    }
  }
  namespace GetExtensionsConfiguration {
    namespace Responses {
      export type $200 = Components.Schemas.PluginInstallationConfigResponse;
    }
  }
  namespace GetNodeEnvironment {
    namespace Responses {
      export interface $200 {
        /**
         * example:
         * development
         */
        nodeEnv?: 'development' | 'production' | 'test';
      }
    }
  }
  namespace GetPluginConfigAuthorization {
    namespace Parameters {
      export type Name = string;
      export type Namespace = string;
    }
    export interface PathParameters {
      namespace: Parameters.Namespace;
      name: Parameters.Name;
    }
    namespace Responses {
      export type $200 = Components.Schemas.PluginAuthorizationResponse;
      export interface $401 {}
    }
  }
  namespace GetPluginConfigByName {
    namespace Parameters {
      export type Name = string;
      export type Namespace = string;
    }
    export interface PathParameters {
      namespace: Parameters.Namespace;
      name: Parameters.Name;
    }
    namespace Responses {
      export type $200 = Components.Schemas.PluginConfigurationResponse;
      export interface $401 {}
    }
  }
  namespace GetPluginPackages {
    namespace Parameters {
      export type Name = string;
      export type Namespace = string;
    }
    export interface PathParameters {
      namespace: Parameters.Namespace;
      name: Parameters.Name;
    }
    namespace Responses {
      export type $200 = Components.Schemas.PluginPackageListResponse;
      export interface $401 {}
    }
  }
  namespace GetPlugins {
    namespace Parameters {
      export type Filter = string;
      export type Limit = number;
      export type Offset = number;
    }
    export interface QueryParameters {
      filter?: Parameters.Filter;
      limit?: Parameters.Limit;
      offset?: Parameters.Offset;
    }
    namespace Responses {
      export interface $200 {
        items?: Components.Schemas.Plugin[];
      }
    }
  }
  namespace InstallPlugin {
    namespace Parameters {
      export type Name = string;
      export type Namespace = string;
    }
    export interface PathParameters {
      namespace: Parameters.Namespace;
      name: Parameters.Name;
    }
    export interface RequestBody {
      /**
       * YAML string of configuration
       */
      configYaml: string;
    }
    namespace Responses {
      export type $200 = Components.Schemas.PluginConfigurationStatusResponse;
      export interface $400 {}
      export interface $401 {}
    }
  }
}

export interface OperationMethods {
  /**
   * getPlugins - List available plugins
   */
  'getPlugins'(
    parameters?: Parameters<Paths.GetPlugins.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.GetPlugins.Responses.$200>;
  /**
   * getPluginConfigAuthorization - Check plugin authorization for read/write actions
   */
  'getPluginConfigAuthorization'(
    parameters?: Parameters<Paths.GetPluginConfigAuthorization.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.GetPluginConfigAuthorization.Responses.$200>;
  /**
   * getExtensionsConfiguration - Check if plugin installation is enabled
   */
  'getExtensionsConfiguration'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.GetExtensionsConfiguration.Responses.$200>;
  /**
   * getPluginConfigByName - Get plugin configuration YAML
   */
  'getPluginConfigByName'(
    parameters?: Parameters<Paths.GetPluginConfigByName.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.GetPluginConfigByName.Responses.$200>;
  /**
   * installPlugin - Install or update plugin configuration
   */
  'installPlugin'(
    parameters?: Parameters<Paths.InstallPlugin.PathParameters> | null,
    data?: Paths.InstallPlugin.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.InstallPlugin.Responses.$200>;
  /**
   * disablePlugin - Disable or enable a plugin
   */
  'disablePlugin'(
    parameters?: Parameters<Paths.DisablePlugin.PathParameters> | null,
    data?: Paths.DisablePlugin.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.DisablePlugin.Responses.$200>;
  /**
   * getPluginPackages - Get packages associated with a plugin
   */
  'getPluginPackages'(
    parameters?: Parameters<Paths.GetPluginPackages.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.GetPluginPackages.Responses.$200>;
  /**
   * getNodeEnvironment - Get the current Node environment
   */
  'getNodeEnvironment'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.GetNodeEnvironment.Responses.$200>;
}

export interface PathsDictionary {
  ['/plugins']: {
    /**
     * getPlugins - List available plugins
     */
    'get'(
      parameters?: Parameters<Paths.GetPlugins.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetPlugins.Responses.$200>;
  };
  ['/plugin/{namespace}/{name}/configuration/authorize']: {
    /**
     * getPluginConfigAuthorization - Check plugin authorization for read/write actions
     */
    'get'(
      parameters?: Parameters<Paths.GetPluginConfigAuthorization.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetPluginConfigAuthorization.Responses.$200>;
  };
  ['/plugins/configure']: {
    /**
     * getExtensionsConfiguration - Check if plugin installation is enabled
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetExtensionsConfiguration.Responses.$200>;
  };
  ['/plugin/{namespace}/{name}/configuration']: {
    /**
     * getPluginConfigByName - Get plugin configuration YAML
     */
    'get'(
      parameters?: Parameters<Paths.GetPluginConfigByName.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetPluginConfigByName.Responses.$200>;
    /**
     * installPlugin - Install or update plugin configuration
     */
    'post'(
      parameters?: Parameters<Paths.InstallPlugin.PathParameters> | null,
      data?: Paths.InstallPlugin.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.InstallPlugin.Responses.$200>;
  };
  ['/plugin/{namespace}/{name}/configuration/disable']: {
    /**
     * disablePlugin - Disable or enable a plugin
     */
    'patch'(
      parameters?: Parameters<Paths.DisablePlugin.PathParameters> | null,
      data?: Paths.DisablePlugin.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.DisablePlugin.Responses.$200>;
  };
  ['/plugin/{namespace}/{name}/packages']: {
    /**
     * getPluginPackages - Get packages associated with a plugin
     */
    'get'(
      parameters?: Parameters<Paths.GetPluginPackages.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetPluginPackages.Responses.$200>;
  };
  ['/environment']: {
    /**
     * getNodeEnvironment - Get the current Node environment
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetNodeEnvironment.Responses.$200>;
  };
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>;

export type Plugin = Components.Schemas.Plugin;
export type PluginAuthorizationResponse =
  Components.Schemas.PluginAuthorizationResponse;
export type PluginConfigurationResponse =
  Components.Schemas.PluginConfigurationResponse;
export type PluginConfigurationStatusResponse =
  Components.Schemas.PluginConfigurationStatusResponse;
export type PluginDisableRequest = Components.Schemas.PluginDisableRequest;
export type PluginInstallationConfigResponse =
  Components.Schemas.PluginInstallationConfigResponse;
export type PluginPackageListResponse =
  Components.Schemas.PluginPackageListResponse;
