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

import {
  getScreenContextLabelSnapshot,
  isInsideScreenCaptureExclude,
  resetScreenContextLabelSnapshotCache,
} from '../screenContextLabelSubscription';

describe('getScreenContextLabelSnapshot', () => {
  beforeEach(() => {
    resetScreenContextLabelSnapshotCache();
    document.body.innerHTML = `<div id="root"><main></main></div>`;
    window.history.pushState(
      {},
      '',
      '/create/templates/default/argocd-template',
    );
  });

  it('includes resolved chip label so template card titles refresh the snapshot', () => {
    expect(getScreenContextLabelSnapshot()).toContain('argocd-template');

    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <h2 class="MuiCardHeader-title BackstageInfoCard-headerTitle-2414">
          Add ArgoCD to an existing project template
        </h2>
      `;
    }

    const snapshot = getScreenContextLabelSnapshot();
    expect(snapshot).toContain('Add ArgoCD to an existing project templ');
    expect(snapshot.endsWith('argocd-template')).toBe(false);
  });
});

describe('isInsideScreenCaptureExclude', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns true for a Text node inside an excluded element', () => {
    document.body.innerHTML = `
      <div data-screen-capture-exclude>
        <p id="stream">streaming</p>
      </div>
    `;
    const textNode = document.getElementById('stream')?.firstChild;
    expect(textNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(isInsideScreenCaptureExclude(textNode as Node)).toBe(true);
  });

  it('returns false for a Text node outside an excluded element', () => {
    document.body.innerHTML = `<p id="page-title">Catalog</p>`;
    const textNode = document.getElementById('page-title')?.firstChild;
    expect(textNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(isInsideScreenCaptureExclude(textNode as Node)).toBe(false);
  });
});
