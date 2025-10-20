'use strict';

class DefaultNotificationService {
  constructor(discovery, auth) {
    this.discovery = discovery;
    this.auth = auth;
  }
  static create(options) {
    return new DefaultNotificationService(options.discovery, options.auth);
  }
  async send(notification) {
    try {
      const baseUrl = await this.discovery.getBaseUrl("notifications");
      const { token } = await this.auth.getPluginRequestToken({
        onBehalfOf: await this.auth.getOwnServiceCredentials(),
        targetPluginId: "notifications"
      });
      const response = await fetch(baseUrl, {
        method: "POST",
        body: JSON.stringify(notification),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to send notifications: ${error}`);
    }
  }
}

exports.DefaultNotificationService = DefaultNotificationService;
//# sourceMappingURL=DefaultNotificationService.cjs.js.map
