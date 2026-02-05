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

import { test, expect } from '@playwright/test';
import { performGuestLogin } from './fixtures/auth';

test('App should render the welcome page', async ({ page }) => {
  await page.goto('/');

  // Perform guest login - no mocks needed, real auth works fine
  await performGuestLogin(page);

  // The app redirects to /catalog and shows the Red Hat Catalog heading
  await expect(
    page.getByRole('heading', { name: 'Red Hat Catalog' }),
  ).toBeVisible({ timeout: 10000 });
});
