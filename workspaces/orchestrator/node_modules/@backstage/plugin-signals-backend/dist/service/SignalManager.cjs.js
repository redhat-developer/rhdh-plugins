'use strict';

var crypto = require('crypto');
var ws = require('ws');
var uuid = require('uuid');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var crypto__default = /*#__PURE__*/_interopDefaultCompat(crypto);

class SignalManager {
  connections = /* @__PURE__ */ new Map();
  events;
  logger;
  pingInterval;
  static create(options) {
    return new SignalManager(options);
  }
  constructor(options) {
    this.events = options.events;
    const id = `signals-${crypto__default.default.randomBytes(8).toString("hex")}`;
    this.logger = options.logger.child({ subscriberId: id });
    this.logger.info(`Signals manager is subscribing to signals events`);
    this.events.subscribe({
      id,
      topics: ["signals"],
      onEvent: (params) => this.onEventBrokerEvent(params.eventPayload)
    });
    options.lifecycle.addShutdownHook(() => this.onShutdown());
  }
  ping() {
    this.connections.forEach((conn) => {
      if (!conn.isAlive) {
        this.logger.debug(`Connection ${conn.id} is not alive, terminating`);
        conn.ws.terminate();
        return;
      }
      conn.isAlive = false;
      conn.ws.ping();
    });
  }
  onShutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.connections.forEach((conn) => {
      conn.ws.terminate();
    });
    this.connections.clear();
  }
  addConnection(ws, identity) {
    if (!this.pingInterval) {
      this.pingInterval = setInterval(() => this.ping(), 3e4);
    }
    const id = uuid.v4();
    const conn = {
      id,
      user: identity?.userEntityRef ?? "user:default/guest",
      ws,
      ownershipEntityRefs: identity?.ownershipEntityRefs ?? [
        "user:default/guest"
      ],
      subscriptions: /* @__PURE__ */ new Set(),
      isAlive: true
    };
    this.connections.set(id, conn);
    this.logger.debug(`Connection ${id} connected`);
    ws.on("error", (err) => {
      this.logger.error(
        `Error occurred with connection ${id}: ${err}, closing connection`
      );
      ws.terminate();
      this.connections.delete(id);
    });
    ws.on("close", (code, reason) => {
      this.logger.debug(
        `Connection ${id} closed with code ${code}, reason: ${reason}`
      );
      ws.terminate();
      this.connections.delete(id);
    });
    ws.on("ping", () => {
      conn.isAlive = true;
      ws.pong();
    });
    ws.on("pong", () => {
      conn.isAlive = true;
    });
    ws.on("message", (data, isBinary) => {
      this.logger.debug(`Received message from connection ${id}: ${data}`);
      if (isBinary) {
        return;
      }
      try {
        const json = JSON.parse(data.toString());
        this.handleMessage(conn, json);
      } catch (err) {
        this.logger.error(
          `Invalid message received from connection ${id}: ${err}`
        );
      }
    });
  }
  handleMessage(connection, message) {
    if (message.action === "subscribe" && message.channel) {
      this.logger.debug(
        `Connection ${connection.id} subscribed to ${message.channel}`
      );
      connection.subscriptions.add(message.channel);
    } else if (message.action === "unsubscribe" && message.channel) {
      this.logger.debug(
        `Connection ${connection.id} unsubscribed from ${message.channel}`
      );
      connection.subscriptions.delete(message.channel);
    }
  }
  async onEventBrokerEvent(eventPayload) {
    if (!eventPayload.channel || !eventPayload.message) {
      return;
    }
    const { channel, recipients, message } = eventPayload;
    const jsonMessage = JSON.stringify({ channel, message });
    let users = [];
    if (recipients.type === "user") {
      users = Array.isArray(recipients.entityRef) ? recipients.entityRef : [recipients.entityRef];
    }
    this.connections.forEach((conn) => {
      if (!conn.subscriptions.has(channel)) {
        return;
      }
      if (recipients.type !== "broadcast" && !conn.ownershipEntityRefs.some((ref) => users.includes(ref))) {
        return;
      }
      if (conn.ws.readyState !== ws.WebSocket.OPEN) {
        return;
      }
      conn.ws.send(jsonMessage, (err) => {
        if (err) {
          this.logger.error(`Failed to send message to ${conn.id}: ${err}`);
        }
      });
    });
  }
}

exports.SignalManager = SignalManager;
//# sourceMappingURL=SignalManager.cjs.js.map
