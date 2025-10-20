import { notificationSeverities } from './constants.esm.js';

const getProcessorFiltersFromConfig = (config) => {
  const filter = {};
  const minSeverity = config.getOptionalString(
    "filter.minSeverity"
  );
  if (minSeverity) {
    if (notificationSeverities.includes(minSeverity)) {
      filter.minSeverity = minSeverity;
    } else {
      throw new Error(`Invalid minSeverity: ${minSeverity}`);
    }
  }
  const maxSeverity = config.getOptionalString(
    "filter.maxSeverity"
  );
  if (maxSeverity) {
    if (notificationSeverities.includes(maxSeverity)) {
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

export { getProcessorFiltersFromConfig };
//# sourceMappingURL=filters.esm.js.map
