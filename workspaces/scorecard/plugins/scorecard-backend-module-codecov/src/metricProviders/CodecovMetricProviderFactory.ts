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

import type { Config } from '@backstage/config';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { CodecovMetricProvider } from './CodecovMetricProvider';
import { CODECOV_METRICS } from './CodecovConfig';

export class CodecovMetricProviderFactory {
  private constructor() {}

  static fromConfig(config: Config, logger: LoggerService): MetricProvider[] {
    return CODECOV_METRICS.map(metricId =>
      CodecovMetricProvider.fromConfig(config, logger, metricId),
    );
  }
}
