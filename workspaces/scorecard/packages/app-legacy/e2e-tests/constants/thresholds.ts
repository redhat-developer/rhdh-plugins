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

/** Matches the configured thresholds for `openPrsWeightedKpi` in app-config.yaml. */
export const OPEN_PRS_WEIGHTED_KPI_THRESHOLDS = {
  rules: [
    { key: 'success', expression: '>=80', color: '#6bb300' },
    { key: 'warning', expression: '30-80', color: 'rgb(224, 189, 108)' },
    { key: 'error', expression: '<30', color: '#be1ec7' },
  ],
};

export const FILECHECK_BOOLEAN_THRESHOLDS = {
  rules: [
    { key: 'exist', expression: '==true', color: 'success.main' },
    { key: 'missing', expression: '==false', color: 'error.main' },
  ],
};
