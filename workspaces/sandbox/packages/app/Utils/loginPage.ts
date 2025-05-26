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
import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly login_id: string;
  readonly login_pw: string;
  readonly login_id_loc: Locator;
  readonly next_btn: Locator;
  readonly login_pw_loc: Locator;
  readonly tocList: Locator;
  readonly login_btn: Locator;
  readonly header: Locator;

  constructor(page: Page, environment: string) {
    this.page = page;

    if (environment === "dev") {
      this.login_id_loc = page.getByRole('textbox', {
        name: 'Red Hat login or email',
      });
      this.login_pw_loc = page.getByRole('textbox', { name: 'Password' });
      this.next_btn = page.getByRole('button', { name: 'Next' });
      this.login_btn = page.getByRole('button', { name: 'Log in' });
    } else if (environment === "e2e-tests") {
      this.login_id_loc = page.getByRole('textbox', { name: 'Username or email' });
      this.login_pw_loc = page.getByRole('textbox', { name: 'Password' });
      this.login_btn = page.getByRole('button', { name: 'Sign in' });
    }

    this.header = page.locator('header');
  }

  async navigate(url: string) {
    await this.page.goto(url);
  }

  async login(login_id: string, login_pw: string, environment: string) {
    await this.login_id_loc.fill(login_id);
    if (environment === "dev") {
      await this.next_btn.click();
    }
    await this.login_pw_loc.fill(login_pw);
    await this.login_btn.click();
    // Verify header contains expected text
    await expect(this.header).toContainText('Developer Sandbox');
  }
}
