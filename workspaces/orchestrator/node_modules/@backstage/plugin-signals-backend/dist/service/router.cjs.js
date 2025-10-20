'use strict';

var express = require('express');
var Router = require('express-promise-router');
var SignalManager = require('./SignalManager.cjs.js');
var ws = require('ws');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var express__default = /*#__PURE__*/_interopDefaultCompat(express);
var Router__default = /*#__PURE__*/_interopDefaultCompat(Router);

async function createRouter(options) {
  const { logger, discovery, auth, userInfo } = options;
  const manager = SignalManager.SignalManager.create(options);
  let subscribedToUpgradeRequests = false;
  let apiUrl = void 0;
  const webSocketServer = new ws.WebSocketServer({
    noServer: true,
    // handle upgrade manually
    clientTracking: false
    // handle connections in SignalManager
  });
  webSocketServer.on("error", (error) => {
    logger.error(`WebSocket server error: ${error}`);
  });
  const handleUpgrade = async (request, socket, head) => {
    if (!apiUrl) {
      apiUrl = await discovery.getBaseUrl("signals");
    }
    if (!request.url || !apiUrl || !apiUrl.endsWith(request.url)) {
      return;
    }
    let userIdentity = void 0;
    try {
      const token = request.headers["sec-websocket-protocol"];
      if (token) {
        const credentials = await auth.authenticate(token);
        if (auth.isPrincipal(credentials, "user")) {
          userIdentity = await userInfo.getUserInfo(credentials);
        }
      }
    } catch (e) {
      logger.error(`Failed to authenticate WebSocket connection: ${e}`);
      socket.write(
        "HTTP/1.1 401 Web Socket Protocol Handshake\r\nUpgrade: WebSocket\r\nConnection: Upgrade\r\n\r\n"
      );
      socket.destroy();
      return;
    }
    try {
      webSocketServer.handleUpgrade(
        request,
        socket,
        head,
        (ws, __) => {
          manager.addConnection(ws, userIdentity);
        }
      );
    } catch (e) {
      logger.error(`Failed to handle WebSocket upgrade: ${e}`);
      socket.write(
        "HTTP/1.1 500 Web Socket Protocol Handshake\r\nUpgrade: WebSocket\r\nConnection: Upgrade\r\n\r\n"
      );
      socket.destroy();
    }
  };
  const upgradeMiddleware = async (req, _, next) => {
    const server = req.socket?.server;
    if (subscribedToUpgradeRequests || !server || !req.headers || req.headers.upgrade === void 0 || req.headers.upgrade.toLowerCase() !== "websocket") {
      next();
      return;
    }
    subscribedToUpgradeRequests = true;
    server.on("upgrade", handleUpgrade);
  };
  const router = Router__default.default();
  router.use(express__default.default.json());
  router.use(upgradeMiddleware);
  router.get("/health", (_, response) => {
    response.json({ status: "ok" });
  });
  return router;
}

exports.createRouter = createRouter;
//# sourceMappingURL=router.cjs.js.map
