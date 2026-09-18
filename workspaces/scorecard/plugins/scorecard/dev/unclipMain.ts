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
 * Plugin `yarn start` only. The RHDH theme caps <main> at
 * calc(100vh - 2 * pageInset) and clips overflow. A .css import is not
 * reliable here (css-loader modules rewrite `main`), so inject a global tag.
 */
export const applyPluginDevMainUnclip = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const id = 'scorecard-plugin-dev-unclip-main';
  const existing = document.getElementById(id);
  if (existing) {
    document.head.appendChild(existing);
    return;
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    [class*="BackstageSidebarPage"] > main,
    main {
      max-height: none !important;
      height: auto !important;
      clip-path: none !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
};
