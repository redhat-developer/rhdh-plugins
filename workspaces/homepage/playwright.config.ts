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

const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'ja'] as const;

const baseConfig = `${__dirname}/app-config.yaml`;
const testConfigDir = `${__dirname}/e2e-tests/test_yamls`;
const defaultWidgetsConfig = `${testConfigDir}/app-config-e2e-default-widgets.yaml`;

const PERSONA_SERVERS = [
  {
    frontendPort: 3001,
    backendPort: 7008,
    overlay: `${testConfigDir}/app-config-e2e-admin.yaml`,
  },
  {
    frontendPort: 3002,
    backendPort: 7009,
    overlay: `${testConfigDir}/app-config-e2e-developer.yaml`,
  },
  {
    frontendPort: 3003,
    backendPort: 7010,
    overlay: `${testConfigDir}/app-config-e2e-overlap.yaml`,
  },
] as const;

export default defineConfig({
  // E2E tests run full app + login + locale; beforeAll can take 30–60s
  timeout: 120 * 1000,

  expect: {
    timeout: 15000,
  },

  // One worker avoids guest-auth flakes when 4 Backstage stacks are up
  workers: 1,
  fullyParallel: false,

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : [
        {
          command: `yarn start --config ${baseConfig}`,
          url: 'http://localhost:7007/.backstage/health/v1/readiness',
          timeout: 240000,
          reuseExistingServer: !process.env.CI,
          cwd: __dirname,
        },
        ...PERSONA_SERVERS.map(persona => ({
          command: `yarn start --config ${baseConfig} --config ${defaultWidgetsConfig} --config ${persona.overlay}`,
          url: `http://localhost:${persona.backendPort}/.backstage/health/v1/readiness`,
          timeout: 240000,
          reuseExistingServer: !process.env.CI,
          cwd: __dirname,
        })),
      ],

  retries: process.env.CI ? 2 : 0,

  reporter: [['html', { open: 'never', outputFolder: 'e2e-test-report' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  outputDir: 'node_modules/.cache/e2e-test-results',

  testDir: 'e2e-tests',

  projects: [
    {
      name: 'en',
      use: {
        channel: 'chrome' as const,
        locale: 'en',
      },
    },
    ...LOCALES.filter(locale => locale !== 'en').map(locale => ({
      name: locale,
      testMatch: '**/homepageCards.test.ts',
      use: {
        channel: 'chrome' as const,
        locale,
      },
    })),
  ],
});
