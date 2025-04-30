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
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

export type RSSClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

export interface RSSFeedApi {
  fetch(): Promise<any>;
}

/**
 * @public
 */
export class RSSClient implements RSSFeedApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: RSSClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private readonly rssAPI = async (): Promise<string> => {
    return `${await this.discoveryApi.getBaseUrl('proxy')}/ai-rssfeed/`;
  };

  async fetch(): Promise<any> {
    const feedUrl = await this.rssAPI();

    const response = await this.fetchApi.fetch(feedUrl, {
      method: 'GET',
    });

    return response.text();
  }
}
