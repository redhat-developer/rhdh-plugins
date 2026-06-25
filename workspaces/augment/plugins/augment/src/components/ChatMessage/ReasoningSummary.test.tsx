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

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReasoningSummary } from './ReasoningSummary';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ReasoningSummary', () => {
  it('returns null for empty reasoning', () => {
    const { container } = renderWithTheme(<ReasoningSummary reasoning="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Thought for Xs" with duration', () => {
    renderWithTheme(
      <ReasoningSummary reasoning="Analyzed query" reasoningDuration={3} />,
    );

    expect(screen.getByText('Thought for 3s')).toBeInTheDocument();
  });

  it('shows "Thought process" when no duration', () => {
    renderWithTheme(<ReasoningSummary reasoning="Quick check" />);

    expect(screen.getByText('Thought process')).toBeInTheDocument();
  });

  it('shows preview snippet when collapsed', () => {
    renderWithTheme(
      <ReasoningSummary
        reasoning="Looking up weather information for the user"
        reasoningDuration={2}
      />,
    );

    expect(
      screen.getByText(/— Looking up weather information for the user/),
    ).toBeInTheDocument();
  });

  it('hides preview and shows full text when expanded', () => {
    const reasoning =
      'Step 1: Parse the query\nStep 2: Look up weather data\nStep 3: Format response';
    renderWithTheme(
      <ReasoningSummary reasoning={reasoning} reasoningDuration={4} />,
    );

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    fireEvent.click(button);

    expect(screen.getByText(/Step 1: Parse the query/)).toBeInTheDocument();
    expect(screen.getByText(/Step 3: Format response/)).toBeInTheDocument();
    expect(screen.queryByText(/^— /)).toBeNull();
  });

  it('toggles expand/collapse on click', () => {
    renderWithTheme(<ReasoningSummary reasoning="Toggle test" />);

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles on Enter key', () => {
    renderWithTheme(<ReasoningSummary reasoning="Keyboard test" />);

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles on Space key', () => {
    renderWithTheme(<ReasoningSummary reasoning="Space test" />);

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    fireEvent.keyDown(button, { key: ' ' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
