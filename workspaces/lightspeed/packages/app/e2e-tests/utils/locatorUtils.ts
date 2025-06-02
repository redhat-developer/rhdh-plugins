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
import { Page, Locator } from '@playwright/test';

type AriaRole = 'button' | 'textbox' | 'separator' | 'link' | 'checkbox';

export function getElementByRole(
  page: Page,
  role: AriaRole,
  name: string,
): Locator {
  return page.getByRole(role, { name });
}

export function getTextByContent(page: Page, text: string): Locator {
  return page.getByText(text);
}

export function getSpanContainingText(page: Page, text: string): Locator {
  return page.locator('span').filter({ hasText: text });
}

export function getDivWithExactText(page: Page, regex: RegExp): Locator {
  return page.locator('div').filter({ hasText: regex });
}

export function getLabelByName(
  page: Page,
  name: string,
  exact = true,
): Locator {
  return page.getByLabel(name, { exact });
}
