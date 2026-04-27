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

import type {
  CacheService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { FilecheckClient } from '../clients/FilecheckClient';
import { parseFilecheckConfig } from './FilecheckConfig';
import { FilecheckMetricProvider } from './FilecheckMetricProvider';

/**
 * Creates a FilecheckMetricProvider from root Backstage config and services.
 * Returns undefined if no files are configured under `scorecard.plugins.filecheck.files`.
 */
export function createFilecheckMetricProvider(
  config: Config,
  urlReader: UrlReaderService,
  cache: CacheService,
): FilecheckMetricProvider | undefined {
  const filesConfig = parseFilecheckConfig(config);
  if (!filesConfig) {
    return undefined;
  }

  const client = new FilecheckClient(urlReader, cache);
  return new FilecheckMetricProvider(client, filesConfig);
}
