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

import { Page } from '@playwright/test';
import { getElementByRole } from './locatorUtils';

export const openLightspeed = async (page: Page) => {
  const navLink = getElementByRole(page, 'link', 'Lightspeed');
  await navLink.click();

  // Assuming this is a static selector not handled in locatorUtils
  await page.locator('.pf-chatbot__messagebox').waitFor({ state: 'visible' });
};

export const sendMessage = async (message: string, page: Page) => {
  const inputLocator = getElementByRole(page, 'textbox', 'Send a message...');
  await inputLocator.fill(message);
  const sendButton = getElementByRole(page, 'button', 'Send button');
  await sendButton.click();

};
