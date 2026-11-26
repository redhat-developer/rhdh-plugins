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
import { createDevApp } from '@backstage/dev-utils';
// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';

import {
  globalHeaderTestPlugin,
  TestHeader,
  TestButton,
  CrashButton,
  CrashHeader,
} from '../src/plugin';

createDevApp()
  .registerPlugin(globalHeaderTestPlugin)
  .addPage({
    element: <TestHeader />,
    title: 'TestHeader',
    path: '/test-header',
  })
  .addPage({
    element: <TestButton />,
    title: 'TestButton',
    path: '/test-button',
  })
  .addPage({
    element: <CrashButton />,
    title: 'CrashButton',
    path: '/crash-button',
  })
  .addPage({
    element: <CrashHeader />,
    title: 'CrashHeader',
    path: '/crash-header',
  })
  .render();
