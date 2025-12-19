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

import { TypedResponse } from '../../generated';
import {
  CostManagementReport,
  DownloadCostManagementRequest,
  GetCostManagementRequest,
} from './types';

export interface CostManagementSlimApi {
  getCostManagementReport(
    request: GetCostManagementRequest,
  ): Promise<TypedResponse<CostManagementReport>>;
  downloadCostManagementReport(
    request: DownloadCostManagementRequest,
  ): Promise<void>;
  searchOpenShiftProjects(
    search?: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  >;
  searchOpenShiftClusters(
    search?: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  >;
  searchOpenShiftNodes(
    search?: string,
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  >;
  getOpenShiftTags(
    timeScopeValue?: number,
  ): Promise<TypedResponse<{ data: string[]; meta?: any; links?: any }>>;
  getOpenShiftTagValues(
    tagKey: string,
    timeScopeValue?: number,
  ): Promise<
    TypedResponse<{
      data: Array<{ key: string; values: string[]; enabled: boolean }>;
      meta?: any;
      links?: any;
    }>
  >;
}
