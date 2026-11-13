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
import userEvent from '@testing-library/user-event';

import { ModelSelectorToggleText } from '../ModelSelectorToggleText';

describe('ModelSelectorToggleText', () => {
  it('renders the full label for CSS ellipsis', () => {
    render(<ModelSelectorToggleText label="mock-model-1" />);
    expect(screen.getByText('mock-model-1')).toBeInTheDocument();
  });

  it('shows a tooltip on hover when the menu is closed', async () => {
    render(<ModelSelectorToggleText label="mock-model-1" />);
    await userEvent.hover(screen.getByText('mock-model-1'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'mock-model-1',
    );
  });

  it('does not render a PatternFly tooltip when hideTooltip is set', async () => {
    render(<ModelSelectorToggleText label="mock-model-1" hideTooltip />);
    await userEvent.hover(screen.getByText('mock-model-1'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
