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

import { render, screen, act } from '@testing-library/react';

import { AppDrawerProvider, useAppDrawer } from './AppDrawerContext';
import { ApplicationDrawer } from './ApplicationDrawer';
import type { AppDrawerContent } from './types';

function OpenButton({ id }: { id: string }) {
  const { openDrawer } = useAppDrawer();
  return <button onClick={() => openDrawer(id)}>Open {id}</button>;
}

function CloseButton({ id }: { id: string }) {
  const { closeDrawer } = useAppDrawer();
  return <button onClick={() => closeDrawer(id)}>Close {id}</button>;
}

function renderWithProvider(contents: AppDrawerContent[]) {
  return render(
    <AppDrawerProvider>
      <ApplicationDrawer contents={contents}>
        <OpenButton id="test-drawer" />
        <CloseButton id="test-drawer" />
      </ApplicationDrawer>
    </AppDrawerProvider>,
  );
}

describe('ApplicationDrawer', () => {
  afterEach(() => {
    document.body.classList.remove('docked-drawer-open');
    document.body.style.removeProperty('--docked-drawer-width');
  });

  it('renders nothing when contents is empty', () => {
    const { container } = renderWithProvider([]);
    expect(container.querySelector('.MuiDrawer-root')).toBeNull();
  });

  it('renders nothing when no drawer is active', () => {
    const contents: AppDrawerContent[] = [
      { id: 'test-drawer', element: <div>Drawer Content</div> },
    ];
    renderWithProvider(contents);

    expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
  });

  it('renders drawer content when opened', () => {
    const contents: AppDrawerContent[] = [
      { id: 'test-drawer', element: <div>Drawer Content</div> },
    ];
    renderWithProvider(contents);

    act(() => {
      screen.getByText('Open test-drawer').click();
    });

    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('adds CSS class and variable when drawer is open', () => {
    const contents: AppDrawerContent[] = [
      { id: 'test-drawer', element: <div>Content</div> },
    ];
    renderWithProvider(contents);

    act(() => {
      screen.getByText('Open test-drawer').click();
    });

    expect(document.body.classList.contains('docked-drawer-open')).toBe(true);
    expect(document.body.style.getPropertyValue('--docked-drawer-width')).toBe(
      '500px',
    );
  });

  it('removes CSS class and variable when drawer is closed', () => {
    const contents: AppDrawerContent[] = [
      { id: 'test-drawer', element: <div>Content</div> },
    ];
    renderWithProvider(contents);

    act(() => {
      screen.getByText('Open test-drawer').click();
    });
    act(() => {
      screen.getByText('Close test-drawer').click();
    });

    expect(document.body.classList.contains('docked-drawer-open')).toBe(false);
    expect(document.body.style.getPropertyValue('--docked-drawer-width')).toBe(
      '',
    );
  });
});
