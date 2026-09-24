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

/**
 * Backstage CLI module that adds Rsdoctor bundle analysis commands.
 *
 * @packageDocumentation
 */

import { createCliModule } from '@backstage/cli-node';
import packageJson from '../package.json';

export default createCliModule({
  packageJson,
  init: async reg => {
    reg.addCommand({
      path: ['rsdoctor', 'build'],
      description:
        'Build the current frontend package with Rspack and generate an Rsdoctor report',
      execute: { loader: () => import('./commands/build') },
    });
    reg.addCommand({
      path: ['rsdoctor', 'start'],
      description:
        'Start the dev server of the current frontend package with a live Rsdoctor report',
      execute: { loader: () => import('./commands/start') },
    });
    reg.addCommand({
      path: ['rsdoctor', 'analyze'],
      description: 'Open the Rsdoctor report of a previous build',
      execute: { loader: () => import('./commands/analyze') },
    });
    reg.addCommand({
      path: ['rsdoctor', 'check'],
      description:
        'Check the sizes of a previous build against the size budgets without rebuilding',
      execute: { loader: () => import('./commands/check') },
    });
    reg.addCommand({
      path: ['rsdoctor', 'diff'],
      description:
        'Compare the bundle sizes of two builds and optionally generate the Rsdoctor bundle diff',
      execute: { loader: () => import('./commands/diff') },
    });
  },
});
