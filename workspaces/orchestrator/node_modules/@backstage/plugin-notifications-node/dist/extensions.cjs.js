'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');

const notificationsProcessingExtensionPoint = backendPluginApi.createExtensionPoint({
  id: "notifications.processing"
});

exports.notificationsProcessingExtensionPoint = notificationsProcessingExtensionPoint;
//# sourceMappingURL=extensions.cjs.js.map
