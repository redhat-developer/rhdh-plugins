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

import type { ComponentProps } from 'react';

import { act, render, screen } from '@testing-library/react';

import { ScreenContextChip } from '../ScreenContextChip';

const renderChip = (
  props: ComponentProps<typeof ScreenContextChip>,
  initialPath = '/catalog/default/component/demo',
) => {
  window.history.pushState({}, '', initialPath);
  return render(<ScreenContextChip {...props} />);
};

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { label?: string }) => {
      if (options?.label) {
        return `${key}:${options.label}`;
      }
      return key;
    },
  }),
}));

describe('ScreenContextChip', () => {
  it('renders recording state with chip label', () => {
    renderChip({
      state: 'recording',
      chipLabel: 'Prototype — Sample documentation',
      domEnabled: true,
      screenshotsEnabled: true,
      supportsVision: false,
    });

    expect(
      screen.getByText('Prototype — Sample documentation'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        'contextChip.aria.pause:Prototype — Sample documentation',
      ),
    ).toBeInTheDocument();
  });

  it('renders paused label', () => {
    renderChip({
      state: 'paused',
      domEnabled: true,
      screenshotsEnabled: true,
      supportsVision: true,
    });

    expect(screen.getByText('contextChip.label.paused')).toBeInTheDocument();
  });

  it('renders unavailable label in fullscreen', () => {
    renderChip({
      state: 'unavailable',
      domEnabled: true,
      screenshotsEnabled: true,
      supportsVision: true,
    });

    expect(
      screen.getByText('contextChip.label.unavailable'),
    ).toBeInTheDocument();
  });

  it('resolves chip label from DOM when route changes', () => {
    document.body.innerHTML = `
      <div id="root">
        <main>
          <h2 class="bui-HeaderTitle">Entity Alpha</h2>
        </main>
      </div>
    `;
    renderChip(
      {
        state: 'recording',
        domEnabled: true,
        screenshotsEnabled: true,
        supportsVision: true,
      },
      '/catalog/default/component/alpha',
    );
    expect(
      screen.getByLabelText('contextChip.aria.pause:Entity Alpha'),
    ).toBeInTheDocument();
  });

  it('updates chip text when the URL changes without refresh', () => {
    document.body.innerHTML = `
      <div id="root">
        <main>
          <h2 class="bui-HeaderTitle">Entity Alpha</h2>
        </main>
      </div>
    `;
    renderChip(
      {
        state: 'recording',
        domEnabled: true,
        screenshotsEnabled: true,
        supportsVision: true,
      },
      '/catalog/default/component/alpha',
    );
    expect(
      screen.getByLabelText('contextChip.aria.pause:Entity Alpha'),
    ).toBeInTheDocument();

    document.querySelector('.bui-HeaderTitle')!.textContent = 'Entity Beta';
    act(() => {
      window.history.pushState({}, '', '/catalog/default/component/beta');
    });

    expect(
      screen.getByLabelText('contextChip.aria.pause:Entity Beta'),
    ).toBeInTheDocument();
  });

  it('shows search query on search route', () => {
    renderChip(
      {
        state: 'recording',
        domEnabled: true,
        screenshotsEnabled: true,
        supportsVision: true,
      },
      '/search?query=payments-api',
    );
    expect(screen.getByText('payments-api')).toBeInTheDocument();
  });
});
