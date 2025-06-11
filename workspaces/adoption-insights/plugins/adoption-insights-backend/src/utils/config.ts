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
import { RootConfigService } from '@backstage/backend-plugin-api';
import { ProcessorConfigOptions } from '../domain/EventBatchProcessor';

export const getConfigurationOptions = (
  config: RootConfigService,
): ProcessorConfigOptions => {
  const batchSize =
    config.getOptionalNumber('app.analytics.adoptionInsights.maxBufferSize') ||
    5;

  const batchInterval =
    config.getOptionalNumber('app.analytics.adoptionInsights.flushInterval') ||
    2000;

  const debug =
    config.getOptionalBoolean('app.analytics.adoptionInsights.debug') || false;

  return {
    debug,
    batchSize,
    batchInterval,
  };
};
export const getLicensedUsersCount = (config: RootConfigService) => {
  return (
    config.getOptionalNumber('app.analytics.adoptionInsights.licensedUsers') ||
    100
  );
};
