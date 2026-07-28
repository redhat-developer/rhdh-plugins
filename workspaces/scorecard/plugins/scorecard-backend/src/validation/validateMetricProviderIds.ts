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

/**
 * Validates provider ID format: `<datasource>.<providerName>`.
 */
export function validateProviderId(
  providerId: string,
  datasourceId: string,
): void {
  const [datasource, providerName, ...rest] = providerId.split('.');
  if (datasource !== datasourceId || !providerName || rest.length > 0) {
    throw new Error(
      `Invalid provider ID '${providerId}', must have format ` +
        `'${datasourceId}.<providerName>' where provider name is not empty`,
    );
  }
}

/**
 * Validates metric ID format: must be `<datasource>.<metricName>`.
 */
export function validateMetricId(metricId: string, datasourceId: string): void {
  const [datasource, metricName, ...rest] = metricId.split('.');
  if (datasource !== datasourceId || !metricName || rest.length > 0) {
    throw new Error(
      `Invalid metric ID '${metricId}', must have format ` +
        `'${datasourceId}.<metricName>' where metric name is not empty`,
    );
  }
}
