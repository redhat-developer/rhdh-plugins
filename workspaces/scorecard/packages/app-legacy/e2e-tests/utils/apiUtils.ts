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
import { Page, expect } from '@playwright/test';

export async function waitUntilApiCallSucceeds(
  page: Page,
  urlPart: string = '/api/scorecard/metrics/catalog/Component/default/red-hat-developer-hub',
): Promise<void> {
  const response = await page.waitForResponse(
    async res => {
      const urlMatches = res.url().includes(urlPart);
      const isSuccess = res.status() === 200;
      return urlMatches && isSuccess;
    },
    { timeout: 60000 },
  );

  expect(response.status()).toBe(200);
}

export async function mockApiResponse(
  page: Page,
  route: string,
  responseData: object,
  status = 200,
) {
  await page.route(route, async r => {
    await r.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/** Non-JSON error bodies (e.g. metadata endpoint 500). */
export async function mockApiTextResponse(
  page: Page,
  route: string,
  body: string,
  status = 500,
) {
  await page.route(route, async r => {
    await r.fulfill({
      status,
      contentType: 'text/plain',
      body,
    });
  });
}
