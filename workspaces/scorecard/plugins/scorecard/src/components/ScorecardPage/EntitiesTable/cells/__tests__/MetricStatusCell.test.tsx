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

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { MetricStatusCell } from '../MetricStatusCell';

const theme = createTheme();

describe('MetricStatusCell', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render status text when status is provided', () => {
    render(
      <ThemeProvider theme={theme}>
        <MetricStatusCell status="success" theme={theme} />
      </ThemeProvider>,
    );

    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('should render -- when status is empty string', () => {
    render(
      <ThemeProvider theme={theme}>
        <MetricStatusCell status="" theme={theme} />
      </ThemeProvider>,
    );

    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should render a colored indicator box', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MetricStatusCell status="success" theme={theme} />
      </ThemeProvider>,
    );

    const box = container.querySelector('[class*="MuiBox"]');
    expect(box).toBeInTheDocument();
  });

  it('should use theme fallback color when status has no palette key', () => {
    render(
      <ThemeProvider theme={theme}>
        <MetricStatusCell status="customStatus" theme={theme} />
      </ThemeProvider>,
    );

    expect(screen.getByText('customStatus')).toBeInTheDocument();
  });
});
