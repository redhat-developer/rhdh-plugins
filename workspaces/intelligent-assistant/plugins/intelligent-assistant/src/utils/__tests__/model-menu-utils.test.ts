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
  getMenuAppendTo,
  getMenuMaxWidthPx,
  setTitleIfClipped,
} from '../model-menu-utils';

describe('model-menu-utils', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('leaves a right margin from the panel edge (RHDHBUGS-4005)', () => {
    const shell = document.createElement('div');
    shell.className = 'pf-chatbot';
    const child = document.createElement('div');
    shell.appendChild(child);
    document.body.appendChild(shell);

    jest.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 420,
      width: 320,
      top: 0,
      bottom: 800,
      height: 800,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });
    jest.spyOn(child, 'getBoundingClientRect').mockReturnValue({
      left: 116,
      right: 220,
      width: 104,
      top: 700,
      bottom: 732,
      height: 32,
      x: 116,
      y: 700,
      toJSON: () => ({}),
    });

    // shell.right - child.left - margin = 420 - 116 - 16
    expect(getMenuMaxWidthPx(child)).toBe(288);
  });

  it('bounds width to the drawer; appends under .pf-chatbot', () => {
    const paper = document.createElement('div');
    paper.className = 'MuiDrawer-paper';
    const shell = document.createElement('div');
    shell.className = 'pf-chatbot';
    const child = document.createElement('div');
    shell.appendChild(child);
    paper.appendChild(shell);
    document.body.appendChild(paper);

    jest.spyOn(paper, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 420,
      width: 320,
      top: 0,
      bottom: 800,
      height: 800,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });
    jest.spyOn(child, 'getBoundingClientRect').mockReturnValue({
      left: 116,
      right: 220,
      width: 104,
      top: 700,
      bottom: 732,
      height: 32,
      x: 116,
      y: 700,
      toJSON: () => ({}),
    });

    // Drawer wins for width; chatbot wins for append host.
    expect(getMenuMaxWidthPx(child)).toBe(288);
    expect(getMenuAppendTo(child)).toBe(shell);
  });

  it('falls back to the viewport when no chat shell is present', () => {
    const orphan = document.createElement('div');
    document.body.appendChild(orphan);

    jest.spyOn(orphan, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 200,
      width: 100,
      top: 0,
      bottom: 40,
      height: 40,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });
    jest.spyOn(window, 'innerWidth', 'get').mockReturnValue(800);

    expect(getMenuMaxWidthPx(orphan)).toBe(684);
    expect(getMenuAppendTo(orphan)).toBe(document.body);
  });

  it('sets title only when the label is clipped', () => {
    const clipped = document.createElement('span');
    clipped.textContent = 'very-long-model-name:latest';
    const visible = document.createElement('span');
    visible.textContent = 'llama3:latest';
    document.body.append(clipped, visible);

    jest.spyOn(clipped, 'scrollWidth', 'get').mockReturnValue(400);
    jest.spyOn(clipped, 'clientWidth', 'get').mockReturnValue(120);
    jest.spyOn(visible, 'scrollWidth', 'get').mockReturnValue(80);
    jest.spyOn(visible, 'clientWidth', 'get').mockReturnValue(80);

    setTitleIfClipped({ currentTarget: clipped });
    setTitleIfClipped({ currentTarget: visible });

    expect(clipped.title).toBe('very-long-model-name:latest');
    expect(visible.title).toBe('');
  });
});
