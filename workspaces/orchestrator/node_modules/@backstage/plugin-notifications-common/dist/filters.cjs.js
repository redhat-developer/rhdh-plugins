'use strict';

var constants = require('./constants.cjs.js');

const getProcessorFiltersFromConfig = (config) => {
  const filter = {};
  const minSeverity = config.getOptionalString(
    "filter.minSeverity"
  );
  if (minSeverity) {
    if (constants.notificationSeverities.includes(minSeverity)) {
      filter.minSeverity = minSeverity;
    } else {
      throw new Error(`Invalid minSeverity: ${minSeverity}`);
    }
  }
  const maxSeverity = config.getOptionalString(
    "filter.maxSeverity"
  );
  if (maxSeverity) {
    if (constants.notificationSeverities.includes(maxSeverity)) {
      filter.maxSeverity = maxSeverity;
    } else {
      throw new Error(`Invalid maxSeverity: ${maxSeverity}`);
    }
  }
  filter.excludedTopics = config.getOptionalStringArray(
    "filter.excludedTopics"
  );
  return filter;
};

exports.getProcessorFiltersFromConfig = getProcessorFiltersFromConfig;
//# sourceMappingURL=filters.cjs.js.map
