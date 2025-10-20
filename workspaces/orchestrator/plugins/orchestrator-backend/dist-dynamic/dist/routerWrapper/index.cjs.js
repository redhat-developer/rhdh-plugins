'use strict';

var DevModeService = require('../service/DevModeService.cjs.js');
var router = require('../service/router.cjs.js');

async function createRouter(args) {
  const autoStartDevMode = args.config.getOptionalBoolean(
    "orchestrator.sonataFlowService.autoStart"
  ) ?? false;
  if (autoStartDevMode) {
    const devModeService = new DevModeService.DevModeService(args.config, args.logger);
    const isSonataFlowUp = await devModeService.launchDevMode();
    if (!isSonataFlowUp) {
      args.logger.error("SonataFlow is not up. Check your configuration.");
    }
  }
  return await router.createBackendRouter({
    config: args.config,
    logger: args.logger,
    auditor: args.auditor,
    discovery: args.discovery,
    catalogApi: args.catalogApi,
    urlReader: args.urlReader,
    scheduler: args.scheduler,
    permissions: args.permissions,
    httpAuth: args.httpAuth,
    userInfo: args.userInfo
  });
}

exports.createRouter = createRouter;
//# sourceMappingURL=index.cjs.js.map
