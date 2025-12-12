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

import { AbstractMetricProvider } from './AbstractMetricProvider';

/**
 * Metric provider for OpenSSF Security-Policy check.
 * Determines if the project has published a security policy.
 */
export class SecurityPolicyMetricProvider extends AbstractMetricProvider {
  protected getMetricName(): string {
    return 'Security-Policy';
  }

  protected getMetricDisplayTitle(): string {
    return 'OpenSSF Security Policy';
  }

  protected getMetricDescription(): string {
    return 'Determines if the project has published a security policy according to OpenSSF Security Scorecards.';
  }
}
