/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createBackend } from '@backstage/backend-defaults';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { metricsServiceRef } from '@backstage/backend-plugin-api/alpha';

// No-op metrics service factory: catalog-backend depends on metricsServiceRef
// but backend-defaults does not yet provide a default factory (still absent as
// of Backstage 1.52 / backend-defaults 0.17.3). Remove this shim when
// backend-defaults adds a default metrics service factory.
const noop = () => {};
const noopMetric = {
  add: noop,
  record: noop,
  addCallback: noop,
  removeCallback: noop,
};
const noopMetricsFactory = createServiceFactory({
  service: metricsServiceRef,
  deps: {},
  factory: () => ({
    createCounter: () => noopMetric,
    createUpDownCounter: () => noopMetric,
    createHistogram: () => noopMetric,
    createGauge: () => noopMetric,
    createObservableCounter: () => noopMetric,
    createObservableUpDownCounter: () => noopMetric,
    createObservableGauge: () => noopMetric,
  }),
});

const backend = createBackend();

backend.add(noopMetricsFactory);

backend.add(import('@backstage/plugin-proxy-backend'));

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

backend.add(import('@backstage/plugin-permission-backend'));
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// Boost plugins
backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend'));
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack'),
);
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti'),
);
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-kagenti-entity-provider'),
);
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider'),
);

backend.start();
