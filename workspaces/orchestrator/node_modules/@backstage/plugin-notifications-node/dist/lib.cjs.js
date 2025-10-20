'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var DefaultNotificationService = require('./service/DefaultNotificationService.cjs.js');

const notificationService = backendPluginApi.createServiceRef({
  id: "notifications.service",
  scope: "plugin",
  defaultFactory: async (service) => backendPluginApi.createServiceFactory({
    service,
    deps: {
      auth: backendPluginApi.coreServices.auth,
      discovery: backendPluginApi.coreServices.discovery
    },
    factory({ auth, discovery }) {
      return DefaultNotificationService.DefaultNotificationService.create({
        auth,
        discovery
      });
    }
  })
});

exports.notificationService = notificationService;
//# sourceMappingURL=lib.cjs.js.map
