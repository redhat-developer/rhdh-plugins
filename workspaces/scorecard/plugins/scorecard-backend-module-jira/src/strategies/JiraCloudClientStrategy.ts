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

import type { JsonObject } from '@backstage/types';
import { z } from 'zod';
import { JiraClient } from '../clients/base';
import { mapJiraIssues } from '../clients/mappers';
import { jiraSearchIssueSchema } from '../clients/schemas/jiraSearchIssue';
import type { JiraIssue, Method } from '../clients/types';
import {
  CLOUD_API_VERSION,
  DEFAULT_PAGINATED_FETCH_ITEMS_LIMIT,
} from '../constants';

export class JiraCloudClientStrategy extends JiraClient {
  public async sendPaginatedRequest<TPage, TOut>(options: {
    url: string;
    method: Method;
    body?: JsonObject;
    responseSchema: z.ZodType<TPage>;
    mapper: (page: TPage) => TOut[];
    fetchItemsLimit?: number;
  }): Promise<TOut[]> {
    const fetchItemsLimit =
      options.fetchItemsLimit ?? DEFAULT_PAGINATED_FETCH_ITEMS_LIMIT;
    const results: TOut[] = [];
    let nextPageToken: string | undefined;
    let hasMorePages = true;
    const headers = await this.getAuthHeaders();

    const cloudPagingSchema = z.object({
      nextPageToken: z.string().optional(),
      isLast: z.boolean().optional(),
    });

    while (hasMorePages && results.length < fetchItemsLimit) {
      const requestBody: JsonObject = {
        ...options.body,
        ...(nextPageToken ? { nextPageToken } : {}),
      };

      const data = await this.sendRequest({
        method: options.method,
        url: options.url,
        headers,
        body: JSON.stringify(requestBody),
      });

      let page: TPage;
      let paging: z.infer<typeof cloudPagingSchema>;
      try {
        page = options.responseSchema.parse(data);
        paging = cloudPagingSchema.parse(data);
      } catch (error) {
        throw new Error(
          `Incorrect response data from ${options.url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      const remaining = fetchItemsLimit - results.length;
      const mapped = options.mapper(page);
      const token = paging.nextPageToken?.trim();
      const hasMorePagesAvailable = Boolean(token) && paging.isLast !== true;

      if (mapped.length >= remaining) {
        results.push(...mapped.slice(0, remaining));
        if (mapped.length > remaining || hasMorePagesAvailable) {
          this.logger.warn(
            `Reached fetchItemsLimit of ${fetchItemsLimit} for Jira request to ${options.url}; stopping fetch`,
          );
        }
        break;
      }

      results.push(...mapped);

      if (!hasMorePagesAvailable) {
        hasMorePages = false;
      } else {
        nextPageToken = token;
        hasMorePages = true;
      }
    }

    return results;
  }

  protected getSearchCountEndpoint(): string {
    return '/search/approximate-count';
  }

  protected buildSearchBody(jql: string): string {
    return JSON.stringify({ jql });
  }

  protected extractIssueCountFromResponse(data: unknown): number {
    if (
      data &&
      typeof data === 'object' &&
      'count' in data &&
      typeof data.count === 'number'
    ) {
      return data.count;
    }

    throw new Error('Incorrect response data for Jira Cloud client');
  }

  protected getApiVersion(): number {
    return CLOUD_API_VERSION;
  }

  public async getIssues(jql: string): Promise<JiraIssue[]> {
    const baseUrl = await this.getBaseUrl();
    return this.sendPaginatedRequest({
      url: `${baseUrl}/search/jql`,
      method: 'POST',
      body: {
        jql,
        fields: ['created', 'resolutiondate'],
      },
      responseSchema: z.object({
        issues: z.array(jiraSearchIssueSchema),
      }),
      mapper: page => mapJiraIssues(page.issues),
    });
  }
}
