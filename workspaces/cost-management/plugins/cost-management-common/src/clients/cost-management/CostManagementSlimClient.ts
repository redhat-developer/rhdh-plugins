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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import crossFetch from 'cross-fetch';
import { pluginId } from '../../generated/pluginId';
import type { TypedResponse } from '../../generated/apis';
import type {
  CostManagementReport,
  GetCostManagementRequest,
  DownloadCostManagementRequest,
} from './types';
import type { CostManagementSlimApi } from './CostManagementSlimApi';
/**
 * Client for Cost Management data.
 *
 * In the frontend, requests are routed through the backend plugin's secure
 * proxy (`/api/cost-management/proxy/...`), which keeps the SSO token
 * server-side and enforces RBAC before forwarding to the Cost Management API.
 *
 * @public
 */
export class CostManagementSlimClient implements CostManagementSlimApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi?: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi ?? { fetch: crossFetch };
  }

  public async getCostManagementReport(
    request: GetCostManagementRequest,
  ): Promise<TypedResponse<CostManagementReport>> {
    const baseUrl = await this.discoveryApi.getBaseUrl(pluginId);
    const uri = '/proxy/reports/openshift/costs/';

    const queryParams = this.buildCostManagementQueryParams(request);

    const queryString = queryParams.toString();
    const queryPart = queryString ? `?${queryString}` : '';
    const url = `${baseUrl}${uri}${queryPart}`;

    return await this.fetchViaBackendProxy<CostManagementReport>(url);
  }

  public async downloadCostManagementReport(
    request: DownloadCostManagementRequest,
  ): Promise<void> {
    const baseUrl = await this.discoveryApi.getBaseUrl(pluginId);
    const uri = '/proxy/reports/openshift/costs/';

    const downloadRequest: GetCostManagementRequest = {
      query: {
        ...request.query,
        'filter[limit]': 0,
      },
    };
    delete downloadRequest.query['filter[offset]'];

    const queryParams = this.buildCostManagementQueryParams(downloadRequest);

    const queryString = queryParams.toString();
    const queryPart = queryString ? `?${queryString}` : '';
    const url = `${baseUrl}${uri}${queryPart}`;

    const acceptHeader =
      request.format === 'csv' ? 'text/csv' : 'application/json';

    const response = await this.fetchApi.fetch(url, {
      headers: {
        Accept: acceptHeader,
      },
      method: 'GET',
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = (await response.json()) as any;
        if (body.error) message = body.error;
      } catch {
        // response may not be JSON
      }
      throw new Error(message);
    }

    // Get the response data
    const responseContentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    let data: string;
    let mimeType: string;

    if (request.format === 'csv') {
      // User wants CSV - use response as-is (API returns CSV by default)
      data = responseText;
      mimeType = 'text/csv';
    } else {
      // User wants JSON
      if (responseContentType.includes('application/json')) {
        // Response is already JSON
        const jsonData = JSON.parse(responseText);
        data = JSON.stringify(jsonData, null, 2);
      } else {
        // Response is CSV, need to convert to JSON
        data = this.convertCsvToJson(responseText);
      }
      mimeType = 'application/json';
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
    const extension = request.format;
    const filename = `openshift-costs-${timestamp}.${extension}`;

    // Trigger download in browser
    const blob = new Blob([data], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Converts CSV string to JSON string
   * @param csv - The CSV data as a string
   * @returns JSON string representation of the CSV data
   */
  private convertCsvToJson(csv: string): string {
    // Normalize line endings (handle both \r\n and \r)
    const normalizedCsv = csv.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    const lines = normalizedCsv.trim().split('\n');
    if (lines.length === 0) {
      return JSON.stringify({ data: [] }, null, 2);
    }

    const headers = this.parseCsvLine(lines[0]);
    const data: Record<string, string | number | null>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, string | number | null> = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j] || '';

        // Try to parse as number if it looks like one
        if (value === '') {
          row[header] = null;
        } else if (!Number.isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else {
          row[header] = value;
        }
      }

      data.push(row);
    }

    return JSON.stringify({ data }, null, 2);
  }

  /**
   * Parses a CSV line handling quoted values
   * @param line - A single line from CSV
   * @returns Array of values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let skipNext = false;

    for (let i = 0; i < line.length; i++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          skipNext = true;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Builds query parameters for cost management report request
   * @param request - The cost management request
   * @returns URLSearchParams with all query parameters
   */
  private buildCostManagementQueryParams(
    request: GetCostManagementRequest,
  ): URLSearchParams {
    const queryParams = new URLSearchParams();
    this.appendBasicQueryParams(queryParams, request);
    this.appendDynamicParams(queryParams, request, 'group_by[');
    this.appendDynamicParams(queryParams, request, 'order_by[');
    this.appendDynamicFilterParams(queryParams, request);
    this.appendDynamicExcludeParams(queryParams, request);
    return queryParams;
  }

  /**
   * Appends basic query parameters (currency, delta, and standard filters)
   */
  private appendBasicQueryParams(
    queryParams: URLSearchParams,
    request: GetCostManagementRequest,
  ): void {
    const basicParams: Array<{
      key: keyof typeof request.query;
      paramName: string;
      needsStringConversion?: boolean;
    }> = [
      { key: 'currency', paramName: 'currency' },
      { key: 'delta', paramName: 'delta' },
      { key: 'category', paramName: 'category' },
      {
        key: 'filter[limit]',
        paramName: 'filter[limit]',
        needsStringConversion: true,
      },
      {
        key: 'filter[offset]',
        paramName: 'filter[offset]',
        needsStringConversion: true,
      },
      { key: 'filter[resolution]', paramName: 'filter[resolution]' },
      {
        key: 'filter[time_scope_units]',
        paramName: 'filter[time_scope_units]',
      },
      {
        key: 'filter[time_scope_value]',
        paramName: 'filter[time_scope_value]',
        needsStringConversion: true,
      },
      {
        key: 'filter[exact:cluster]',
        paramName: 'filter[exact:cluster]',
      },
    ];

    for (const { key, paramName, needsStringConversion } of basicParams) {
      const value = request.query[key];
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(
          paramName,
          needsStringConversion ? String(value) : (value as string),
        );
      }
    }
  }

  /**
   * Appends dynamic parameters that match a specific prefix (e.g., 'group_by[', 'order_by[')
   */
  private appendDynamicParams(
    queryParams: URLSearchParams,
    request: GetCostManagementRequest,
    prefix: string,
  ): void {
    for (const key of Object.keys(request.query)) {
      if (key.startsWith(prefix) && key.endsWith(']')) {
        const value = request.query[key as keyof typeof request.query];
        if (value) {
          queryParams.append(key, String(value));
        }
      }
    }
  }

  /**
   * Appends dynamic filter parameters, excluding those already handled explicitly
   */
  private appendDynamicFilterParams(
    queryParams: URLSearchParams,
    request: GetCostManagementRequest,
  ): void {
    const handledFilterKeys = new Set([
      'filter[limit]',
      'filter[offset]',
      'filter[resolution]',
      'filter[time_scope_units]',
      'filter[time_scope_value]',
    ]);

    for (const key of Object.keys(request.query)) {
      if (
        key.startsWith('filter[') &&
        key.endsWith(']') &&
        !handledFilterKeys.has(key)
      ) {
        const value = request.query[key as keyof typeof request.query];
        if (value) {
          queryParams.append(key, String(value));
        }
      }
    }
  }

  /**
   * Appends dynamic exclude parameters (e.g., exclude[project], exclude[cluster], exclude[tag:key])
   */
  private appendDynamicExcludeParams(
    queryParams: URLSearchParams,
    request: GetCostManagementRequest,
  ): void {
    for (const key of Object.keys(request.query)) {
      if (key.startsWith('exclude[') && key.endsWith(']')) {
        const value = request.query[key as keyof typeof request.query];
        if (value) {
          queryParams.append(key, String(value));
        }
      }
    }
  }

  /**
   * Search OpenShift projects
   * @param search - Search term to filter projects
   * @param options - Optional request options including token and limit
   * @param options.token - Bearer token for authentication (backend use)
   * @param options.limit - Maximum number of results to return (default: 10, use large number for all)
   */
  public async searchOpenShiftProjects(
    search: string = '',
    options?: { token?: string; limit?: number },
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  > {
    const url = await this.buildResourceTypeUrl(
      'openshift-projects',
      search,
      options?.limit,
    );

    // If token provided externally (backend use), use it directly
    if (options?.token) {
      return await this.fetchWithExternalToken(url, options.token);
    }

    // If no external token, use internal token retrieval
    return await this.fetchResourceType(url);
  }

  /**
   * Search OpenShift clusters
   * @param search - Search term to filter clusters
   */
  public async searchOpenShiftClusters(
    search: string = '',
    options?: { token?: string; limit?: number },
  ): Promise<
    TypedResponse<{
      data: Array<{ value: string; cluster_alias: string }>;
      meta?: any;
      links?: any;
    }>
  > {
    const url = await this.buildResourceTypeUrl(
      'openshift-clusters',
      search,
      options?.limit,
    );

    // If token provided externally (backend use), use it directly
    if (options?.token) {
      return await this.fetchWithExternalToken(url, options.token);
    }

    // If no external token, use internal token retrieval
    return await this.fetchResourceType(url);
  }

  /**
   * Search OpenShift nodes
   * @param search - Search term to filter nodes
   */
  public async searchOpenShiftNodes(
    search: string = '',
  ): Promise<
    TypedResponse<{ data: Array<{ value: string }>; meta?: any; links?: any }>
  > {
    const baseUrl = await this.discoveryApi.getBaseUrl(pluginId);
    const searchParam = search ? `?search=${encodeURIComponent(search)}` : '';
    const url = `${baseUrl}/proxy/resource-types/openshift-nodes/${searchParam}`;

    return await this.fetchResourceType(url);
  }

  /**
   * Get OpenShift tags
   * @param timeScopeValue - Time scope value (-1 for month-to-date, -2 for previous-month). Defaults to -1.
   * @returns TypedResponse with array of tag strings
   */
  public async getOpenShiftTags(
    timeScopeValue: number = -1,
  ): Promise<TypedResponse<{ data: string[]; meta?: any; links?: any }>> {
    const baseUrl = await this.discoveryApi.getBaseUrl(pluginId);
    const url = `${baseUrl}/proxy/tags/openshift/?filter[time_scope_value]=${timeScopeValue}&key_only=true&limit=1000`;

    return await this.fetchViaBackendProxy<{
      data: string[];
      meta?: any;
      links?: any;
    }>(url);
  }

  /**
   * Get OpenShift tag values for a specific tag key
   * @param tagKey - The tag key to get values for
   * @param timeScopeValue - Time scope value (-1 for month-to-date, -2 for previous-month). Defaults to -1.
   * @returns TypedResponse with array of tag value objects
   */
  public async getOpenShiftTagValues(
    tagKey: string,
    timeScopeValue: number = -1,
  ): Promise<
    TypedResponse<{
      data: Array<{ key: string; values: string[]; enabled: boolean }>;
      meta?: any;
      links?: any;
    }>
  > {
    const baseUrl = await this.discoveryApi.getBaseUrl(pluginId);
    const url = `${baseUrl}/proxy/tags/openshift/?filter[key]=${encodeURIComponent(
      tagKey,
    )}&filter[time_scope_value]=${timeScopeValue}`;

    return await this.fetchViaBackendProxy<{
      data: Array<{ key: string; values: string[]; enabled: boolean }>;
      meta?: any;
      links?: any;
    }>(url);
  }

  private async fetchResourceType(url: string): Promise<
    TypedResponse<{
      data: Array<{ value: string; cluster_alias: string }>;
      meta?: any;
      links?: any;
    }>
  > {
    return await this.fetchViaBackendProxy<{
      data: Array<{ value: string; cluster_alias: string }>;
      meta?: any;
      links?: any;
    }>(url);
  }

  /**
   * Builds resource type URL routed through the backend secure proxy
   */
  private async buildResourceTypeUrl(
    resourceType: string,
    search?: string,
    limit?: number,
  ): Promise<string> {
    const baseUrl = await this.discoveryApi.getBaseUrl(pluginId);

    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }
    const queryString = params.toString();
    const queryPart = queryString ? `?${queryString}` : '';

    return `${baseUrl}/proxy/resource-types/${resourceType}/${queryPart}`;
  }

  /**
   * Fetches with externally provided token (for backend use).
   * This path bypasses the secure proxy since it's already server-side.
   */
  private async fetchWithExternalToken<T>(
    url: string,
    token: string,
  ): Promise<TypedResponse<T>> {
    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = (await response.json()) as any;
        if (body.error) message = body.error;
      } catch {
        // response may not be JSON
      }
      throw new Error(message);
    }

    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.json(),
    } as TypedResponse<T>;
  }

  /**
   * Fetches a URL via the backend secure proxy. No Authorization header
   * is sent; the backend injects the SSO token and RBAC filters
   * server-side. Authentication is via the Backstage session cookie.
   */
  private async fetchViaBackendProxy<T>(
    url: string,
  ): Promise<TypedResponse<T>> {
    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = (await response.json()) as any;
        if (body.error) message = body.error;
      } catch {
        // response may not be JSON
      }
      throw new Error(message);
    }

    return {
      ...response,
      json: async () => {
        const data = (await response.json()) as T;
        return data;
      },
    };
  }
}
