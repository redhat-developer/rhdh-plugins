/*
 * Copyright 2024 The Backstage Authors
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
import { QUERY_PARAM_BUSINESS_KEY } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { buildUrl } from './UrlUtils';

describe('UrlUtils', () => {
  const baseUrl = 'https://my.base.url.com';
  it('should return the base URL', async () => {
    const res = buildUrl(baseUrl);
    expect(res).toBeDefined();
    expect(res).toEqual(baseUrl);
  });
  it('should return the base URL with the query params', async () => {
    const queryParams: Record<string, any> = {
      param1: 1,
      param2: 'two',
      param3: true,
    };
    const res = buildUrl(baseUrl, queryParams);
    expect(res).toBeDefined();
    expect(res).not.toEqual(`${baseUrl}`);
    expect(res).toEqual(`${baseUrl}?param1=1&param2=two&param3=true`);
  });
  it('should return the base URL with business key param', async () => {
    const queryParams: Record<string, any> = {
      [QUERY_PARAM_BUSINESS_KEY]: 'businessKey1',
    };
    const res = buildUrl(baseUrl, queryParams);
    expect(res).toBeDefined();
    expect(res).not.toEqual(`${baseUrl}`);
    expect(res).toEqual(`${baseUrl}?${QUERY_PARAM_BUSINESS_KEY}=businessKey1`);
  });
});
