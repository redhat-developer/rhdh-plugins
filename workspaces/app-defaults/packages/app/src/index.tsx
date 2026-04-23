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
import 'material-icons/iconfont/outlined.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@backstage/ui/css/styles.css';

// TODO: Remove once @red-hat-developer-hub/backstage-plugin-global-header
// publishes a version with built-in drawer support (width: auto + margin-right
// on the AppBar). Tracked by the GlobalHeader.tsx change in the global-header
// workspace.
const style = document.createElement('style');
style.textContent = `
  #global-header {
    width: auto;
    margin-right: var(--docked-drawer-width, 0px);
    transition: margin-right 225ms cubic-bezier(0, 0, 0.2, 1);
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(App.createRoot());
