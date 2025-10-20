'use strict';

class DefaultSignalsService {
  events;
  static create(options) {
    return new DefaultSignalsService(options);
  }
  constructor(options) {
    ({ events: this.events } = options);
  }
  /**
   * Publishes a signal to user refs to specific topic
   * @param signal - Signal to publish
   */
  async publish(signal) {
    await this.events.publish({
      topic: "signals",
      eventPayload: signal
    });
  }
}
const DefaultSignalService = DefaultSignalsService;

exports.DefaultSignalService = DefaultSignalService;
exports.DefaultSignalsService = DefaultSignalsService;
//# sourceMappingURL=DefaultSignalsService.cjs.js.map
