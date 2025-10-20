'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var alpha = require('@backstage/plugin-catalog-node/alpha');
var index = require('./routerWrapper/index.cjs.js');

const orchestratorPlugin = backendPluginApi.createBackendPlugin({
  pluginId: "orchestrator",
  register(env) {
    env.registerInit({
      deps: {
        logger: backendPluginApi.coreServices.logger,
        auditor: backendPluginApi.coreServices.auditor,
        config: backendPluginApi.coreServices.rootConfig,
        discovery: backendPluginApi.coreServices.discovery,
        catalogApi: alpha.catalogServiceRef,
        urlReader: backendPluginApi.coreServices.urlReader,
        permissions: backendPluginApi.coreServices.permissions,
        scheduler: backendPluginApi.coreServices.scheduler,
        httpAuth: backendPluginApi.coreServices.httpAuth,
        http: backendPluginApi.coreServices.httpRouter,
        userInfo: backendPluginApi.coreServices.userInfo
      },
      async init(props) {
        const { http } = props;
        const router = await index.createRouter(props);
        http.use(router);
        http.addAuthPolicy({
          path: "/health",
          allow: "unauthenticated"
        });
        http.addAuthPolicy({
          path: "/static",
          allow: "unauthenticated"
        });
        http.addAuthPolicy({
          path: "/docs",
          allow: "unauthenticated"
        });
      }
    });
  }
});

exports.orchestratorPlugin = orchestratorPlugin;
//# sourceMappingURL=plugin.cjs.js.map
