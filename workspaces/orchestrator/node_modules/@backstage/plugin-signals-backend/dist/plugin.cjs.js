'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var pluginEventsNode = require('@backstage/plugin-events-node');
var router = require('./service/router.cjs.js');

const signalsPlugin = backendPluginApi.createBackendPlugin({
  pluginId: "signals",
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: backendPluginApi.coreServices.httpRouter,
        logger: backendPluginApi.coreServices.logger,
        config: backendPluginApi.coreServices.rootConfig,
        lifecycle: backendPluginApi.coreServices.rootLifecycle,
        discovery: backendPluginApi.coreServices.discovery,
        userInfo: backendPluginApi.coreServices.userInfo,
        auth: backendPluginApi.coreServices.auth,
        events: pluginEventsNode.eventsServiceRef
      },
      async init({
        httpRouter,
        logger,
        config,
        lifecycle,
        discovery,
        userInfo,
        auth,
        events
      }) {
        httpRouter.use(
          await router.createRouter({
            logger,
            config,
            lifecycle,
            discovery,
            userInfo,
            auth,
            events
          })
        );
        httpRouter.addAuthPolicy({
          path: "/",
          allow: "unauthenticated"
        });
      }
    });
  }
});

exports.signalsPlugin = signalsPlugin;
//# sourceMappingURL=plugin.cjs.js.map
