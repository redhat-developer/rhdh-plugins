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
 * Threshold rule definition
 * @public
 */
export type ThresholdRule = {
  key: string;
  expression: string;
};

/**
 * Threshold configuration
 * @public
 */
export type ThresholdConfig = {
  rules: ThresholdRule[];
};

/**
 * @public
 */
export type ThresholdResult = {
  status: 'success' | 'error';
  definition: ThresholdConfig | undefined;
  evaluation: string | null; // threshold key the expression evaluated to
  error?: string;
};

/**
 * Default threshold configuration for number metrics where high count indicates problems
 * @public
 */
export const DEFAULT_NUMBER_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<10' },
    { key: 'warning', expression: '10-50' },
    { key: 'error', expression: '>50' },
  ],
};
