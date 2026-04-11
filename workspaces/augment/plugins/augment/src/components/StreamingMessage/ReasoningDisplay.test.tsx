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
import { ReasoningDisplay } from './ReasoningDisplay';

const theme = createTheme();
const branding = {
  appName: 'Test',
  primaryColor: '#1e40af',
  secondaryColor: '#475569',
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ReasoningDisplay', () => {
  it('renders chip label "Thinking…" when streaming', () => {
    renderWithTheme(
      <ReasoningDisplay
        reasoning="Looking up information"
        isStreaming
        theme={theme}
        branding={branding}
      />,
    );

    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('shows "Thought for Xs" when reasoning duration is provided', () => {
    renderWithTheme(
      <ReasoningDisplay
        reasoning="Analyzed the data"
        reasoningDuration={5}
        isStreaming={false}
        theme={theme}
        branding={branding}
      />,
    );

    expect(screen.getByText('Thought for 5s')).toBeInTheDocument();
  });

  it('shows "Thought" when not streaming and no duration', () => {
    renderWithTheme(
      <ReasoningDisplay
        reasoning="Quick thought"
        isStreaming={false}
        theme={theme}
        branding={branding}
      />,
    );

    expect(screen.getByText('Thought')).toBeInTheDocument();
  });

  it('shows preview snippet when collapsed', () => {
    const reasoning = 'Looking up weather information for New York';
    renderWithTheme(
      <ReasoningDisplay
        reasoning={reasoning}
        isStreaming
        theme={theme}
        branding={branding}
      />,
    );

    expect(
      screen.getByText(/— Looking up weather information for New York/),
    ).toBeInTheDocument();
  });

  it('hides preview when expanded', () => {
    const reasoning = 'Detailed reasoning text here';
    renderWithTheme(
      <ReasoningDisplay
        reasoning={reasoning}
        isStreaming={false}
        theme={theme}
        branding={branding}
      />,
    );

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    fireEvent.click(button);

    expect(screen.queryByText(/^— /)).toBeNull();
  });

  it('expands reasoning text on click', () => {
    const reasoning = 'Full reasoning content visible after expand';
    renderWithTheme(
      <ReasoningDisplay
        reasoning={reasoning}
        isStreaming={false}
        theme={theme}
        branding={branding}
      />,
    );

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    fireEvent.click(button);

    expect(screen.getByText(reasoning)).toBeInTheDocument();
  });

  it('toggles expanded state on Enter key', () => {
    renderWithTheme(
      <ReasoningDisplay
        reasoning="Key test"
        isStreaming={false}
        theme={theme}
        branding={branding}
      />,
    );

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-expanded correctly', () => {
    renderWithTheme(
      <ReasoningDisplay
        reasoning="aria test"
        isStreaming={false}
        theme={theme}
        branding={branding}
      />,
    );

    const button = screen.getByRole('button', { name: /expand reasoning/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
