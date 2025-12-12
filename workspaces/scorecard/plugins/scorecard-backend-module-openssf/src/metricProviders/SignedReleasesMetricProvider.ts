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
 * Metric provider for OpenSSF Signed-Releases check.
 * Determines if the project cryptographically signs release artifacts.
 */
export class SignedReleasesMetricProvider extends AbstractMetricProvider {
  protected getMetricName(): string {
    return 'Signed-Releases';
  }

  protected getMetricDisplayTitle(): string {
    return 'OpenSSF Signed Releases';
  }

  protected getMetricDescription(): string {
    return 'Determines if the project cryptographically signs release artifacts according to OpenSSF Security Scorecards.';
  }
}
