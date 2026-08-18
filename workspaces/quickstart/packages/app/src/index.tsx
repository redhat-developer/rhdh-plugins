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
import '@backstage/cli/asset-types';
import { sidebarConfig } from '@backstage/core-components';
import 'material-icons/iconfont/outlined.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@backstage/ui/css/styles.css';

// TODO: Remove once @red-hat-developer-hub/backstage-plugin-global-header
// publishes built-in above-sidebar layout (see global-header packages/app-legacy).
const { drawerWidthOpen, drawerWidthClosed } = sidebarConfig;

const style = document.createElement('style');
style.textContent = `
  #global-header {
    width: auto;
    margin-right: var(--docked-drawer-width, 0px);
    transition:
      margin-left 0.1s ease-out,
      margin-right 225ms cubic-bezier(0, 0, 0.2, 1);
  }
  /* Branding lives in the sidebar; avoid duplicate header logo. */
  [data-testid='global-header-company-logo'] {
    display: none;
  }
  /* Keep the header over main content only — not above the sidebar logo column. */
  @media (min-width: 600px) {
    #global-header {
      margin-left: ${drawerWidthOpen}px;
      width: calc(100% - ${drawerWidthOpen}px);
    }
    body:has([data-testid='sidebar-root'] [class*='BackstageSidebar-drawer']:not([class*='drawerOpen']))
      #global-header {
      margin-left: ${drawerWidthClosed}px;
      width: calc(100% - ${drawerWidthClosed}px);
    }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(App.createRoot());
