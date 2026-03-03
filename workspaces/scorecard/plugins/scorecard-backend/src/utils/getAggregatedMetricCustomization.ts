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

import { InputError } from '@backstage/errors';
import type { Config } from '@backstage/config';

export type MetricCustomization = {
  title: string;
  description: string;
  isCustomized: boolean;
};

export function getAggregatedMetricCustomization(
  metricId: string,
  options: {
    config: Config;
  },
): MetricCustomization {
  const toTrimmedString = (v: unknown): string =>
    typeof v === 'string' ? v.trim() : '';

  const [provider, metricName, ...rest] = metricId.split('.');

  if (!provider || !metricName || rest.length > 0) {
    throw new InputError(
      `Invalid metric ID: ${metricId}, must be in the format "provider.metricName"`,
    );
  }

  const configPath = `scorecard.plugins.${provider}.${metricName}.aggregations`;

  const title = options.config.getOptional(`${configPath}.title`);
  const description = options.config.getOptional(`${configPath}.description`);

  if (title === undefined && description === undefined) {
    return { title: '', description: '', isCustomized: false };
  }

  if (title === undefined || description === undefined) {
    throw new InputError(
      `Metric "${metricId}" requires both title and description when customizing aggregated KPI`,
    );
  }

  const trimmedTitle = toTrimmedString(title);
  const trimmedDescription = toTrimmedString(description);

  if (!trimmedTitle || !trimmedDescription) {
    throw new InputError(
      `Metric "${metricId}" requires both title and description to be non-empty strings`,
    );
  }

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    isCustomized: true,
  };
}
