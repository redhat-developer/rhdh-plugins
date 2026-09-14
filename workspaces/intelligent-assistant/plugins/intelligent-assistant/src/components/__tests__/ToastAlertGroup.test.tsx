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

import { MuiThemeTestProvider } from '../../test-utils/MuiThemeTestProvider';
import { ToastAlertGroup } from '../ToastAlertGroup';

describe('ToastAlertGroup', () => {
  it('renders the toast group in a top-right anchored live region', () => {
    render(
      <MuiThemeTestProvider>
        <ToastAlertGroup
          alerts={[{ key: 'deleted', title: 'Notebook deleted!' }]}
          onRemoveAlert={jest.fn()}
        />
      </MuiThemeTestProvider>,
    );

    expect(screen.getByText('Notebook deleted!')).toBeInTheDocument();

    const toastGroup = screen.getByRole('list');
    expect(toastGroup).toHaveAttribute('aria-live', 'polite');
    expect(toastGroup.className).toMatch(/pf-m-toast/);
    expect(toastGroup.parentElement?.parentElement).toBe(document.body);
  });
});
