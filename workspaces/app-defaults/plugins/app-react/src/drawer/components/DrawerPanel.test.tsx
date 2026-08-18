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

import { render, screen } from '@testing-library/react';

import { DrawerPanel } from './DrawerPanel';

describe('DrawerPanel', () => {
  it('renders children when open', () => {
    render(
      <DrawerPanel isDrawerOpen drawerWidth={500}>
        <div>Panel Content</div>
      </DrawerPanel>,
    );

    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('does not show resize handle when isResizable is false', () => {
    render(
      <DrawerPanel isDrawerOpen isResizable={false} drawerWidth={500}>
        <div>Content</div>
      </DrawerPanel>,
    );

    expect(screen.queryByTestId('drawer-resize-handle')).toBeNull();
  });

  it('shows resize handle when isResizable is true', () => {
    render(
      <DrawerPanel isDrawerOpen isResizable drawerWidth={500}>
        <div>Content</div>
      </DrawerPanel>,
    );

    expect(screen.getByTestId('drawer-resize-handle')).toBeInTheDocument();
  });
});
