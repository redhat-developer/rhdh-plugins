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
 * React Router location.state key — which Data Center tab the user used before
 * opening a detail page (environments list vs service specs list).
 */
export const DCM_FROM_TAB_STATE = 'dcmFromTab' as const;

export type DcmFromTab = 'environments' | 'service-specs';

export type DcmLocationState = {
  [DCM_FROM_TAB_STATE]?: DcmFromTab;
};

/**
 * Resolves the Data Center list URL for the breadcrumb "Data Center" link.
 * Uses location.state when present; otherwise falls back to a sensible default per detail page.
 */
export function getDataCenterHomePath(
  rootPath: string,
  state: DcmLocationState | null | undefined,
  defaultTab: DcmFromTab,
): string {
  const tab = state?.[DCM_FROM_TAB_STATE] ?? defaultTab;
  return tab === 'service-specs' ? `${rootPath}/service-specs` : rootPath;
}
