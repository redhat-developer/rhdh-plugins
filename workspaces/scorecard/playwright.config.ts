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

import { defineConfig } from '@playwright/test';

const LOCALES = ['en', 'fr', 'it', 'ja', 'de', 'es'] as const;
const appMode = process.env.APP_MODE || 'legacy';
const startCommand = appMode === 'legacy' ? 'yarn start:legacy' : 'yarn start';

export default defineConfig({
  timeout: 2 * 60 * 1000,

  expect: {
    timeout: 5000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : {
        command: startCommand,
        port: 3000,
        reuseExistingServer: true,
        env: {
          JIRA_URL: 'https://issues.redhat.com',
          JIRA_TOKEN: 'my-jira-token',
        },
      },

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html', { open: 'never', outputFolder: `e2e-test-report-${appMode}` }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  outputDir: `node_modules/.cache/e2e-test-results-${appMode}`,

  projects: LOCALES.map(locale => ({
    name: locale,
    testDir: 'packages/app-legacy/e2e-tests',
    use: {
      channel: 'chrome' as const,
      locale,
    },
  })),
});
