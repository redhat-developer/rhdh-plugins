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

import { Page } from 'playwright';

export const openLightspeed = async (page: Page) => {
  const navLink = page.locator(`nav a:has-text("lightspeed")`).first();
  await navLink.waitFor({ state: 'visible' });
  await navLink.click();

  await page.locator('.pf-chatbot__messagebox').waitFor({ state: 'visible' });
};

export const sendMessage = async (message: string, page: Page) => {
  const inputLocator = page.getByRole('textbox').first();
  await inputLocator.waitFor({ state: 'visible' });
  await inputLocator.fill(message);
  await page.locator('button[aria-label="Send"]').click();
};
