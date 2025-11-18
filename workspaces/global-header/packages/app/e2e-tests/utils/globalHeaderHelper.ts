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

/**
 * Switch to a different locale
 * Extracts base language code (e.g., "en" from "en-US") for locale selection
 */
export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  if (locale !== 'en') {
    await page.getByRole('button', { name: 'Guest' }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('option', { name: locale }).click();
    await page.locator('a').filter({ hasText: 'Home' }).click();
  }
}
