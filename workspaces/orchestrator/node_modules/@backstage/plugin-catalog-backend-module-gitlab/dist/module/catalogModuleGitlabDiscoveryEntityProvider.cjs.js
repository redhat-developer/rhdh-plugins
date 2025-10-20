'use strict';

var backendPluginApi = require('@backstage/backend-plugin-api');
var alpha = require('@backstage/plugin-catalog-node/alpha');
var pluginEventsNode = require('@backstage/plugin-events-node');
var GitlabDiscoveryEntityProvider = require('../providers/GitlabDiscoveryEntityProvider.cjs.js');
require('@backstage/catalog-model');
require('@backstage/integration');
require('lodash');
require('uuid');
require('node-fetch');

const catalogModuleGitlabDiscoveryEntityProvider = backendPluginApi.createBackendModule({
  pluginId: "catalog",
  moduleId: "gitlab-discovery-entity-provider",
  register(env) {
    env.registerInit({
      deps: {
        config: backendPluginApi.coreServices.rootConfig,
        catalog: alpha.catalogProcessingExtensionPoint,
        logger: backendPluginApi.coreServices.logger,
        scheduler: backendPluginApi.coreServices.scheduler,
        events: pluginEventsNode.eventsServiceRef
      },
      async init({ config, catalog, logger, scheduler, events }) {
        const gitlabDiscoveryEntityProvider = GitlabDiscoveryEntityProvider.GitlabDiscoveryEntityProvider.fromConfig(config, {
          logger,
          events,
          scheduler
        });
        catalog.addEntityProvider(gitlabDiscoveryEntityProvider);
      }
    });
  }
});

exports.catalogModuleGitlabDiscoveryEntityProvider = catalogModuleGitlabDiscoveryEntityProvider;
//# sourceMappingURL=catalogModuleGitlabDiscoveryEntityProvider.cjs.js.map
