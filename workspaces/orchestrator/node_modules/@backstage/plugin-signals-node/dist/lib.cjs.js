'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var DefaultSignalsService = require('./DefaultSignalsService.cjs.js');
var pluginEventsNode = require('@backstage/plugin-events-node');

const signalsServiceRef = backendPluginApi.createServiceRef({
  id: "signals.service",
  scope: "plugin",
  defaultFactory: async (service) => backendPluginApi.createServiceFactory({
    service,
    deps: {
      events: pluginEventsNode.eventsServiceRef
    },
    factory({ events }) {
      return DefaultSignalsService.DefaultSignalsService.create({ events });
    }
  })
});
const signalService = signalsServiceRef;

exports.signalService = signalService;
exports.signalsServiceRef = signalsServiceRef;
//# sourceMappingURL=lib.cjs.js.map
