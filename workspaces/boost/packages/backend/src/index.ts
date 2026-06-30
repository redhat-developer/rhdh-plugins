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
import {
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';

/*
 * Metrics compatibility shim.
 *
 * The catalog-backend plugin depends on `coreServices.metrics`, but
 * `backend-defaults` does not yet provide an implementation (as of
 * Backstage 1.52). Register a no-op factory so the backend starts
 * without errors.
 *
 * This import uses the `/alpha` entrypoint because metrics is still
 * in the alpha API surface.
 */
const metricsServiceRef = (() => {
  try {
    // Dynamic import to avoid hard dependency on alpha API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const alpha = require('@backstage/backend-plugin-api/alpha');
    return alpha.coreServices?.metrics;
  } catch {
    return undefined;
  }
})();

const backend = createBackend();

// No-op metrics factory if the service ref is available
if (metricsServiceRef) {
  backend.add(
    createServiceFactory({
      service: metricsServiceRef,
      deps: { logger: coreServices.logger },
      factory({ logger }) {
        logger.info('Using no-op metrics shim (backend-defaults gap)');
        return {};
      },
    }),
  );
}

backend.add(import('@backstage/plugin-app-backend'));

// auth
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

// catalog
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-ai-model'));
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// techdocs
backend.add(import('@backstage/plugin-techdocs-backend'));

// permission (allow-all for dev)
backend.add(import('@backstage/plugin-permission-backend'));
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// Boost plugins
backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend'));
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack'
  ),
);
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti'
  ),
);
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-kagenti-entity-provider'),
);
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider'
  ),
);

backend.start();
