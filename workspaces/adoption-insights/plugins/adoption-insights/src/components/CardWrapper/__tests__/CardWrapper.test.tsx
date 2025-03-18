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
import React from 'react';

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import CardWrapper from '../CardWrapper';

describe('CardWrapper Component', () => {
  const theme = createTheme();

  it('should render with title and children', () => {
    render(
      <ThemeProvider theme={theme}>
        <CardWrapper title="Test Title">
          <p>Test Content</p>
        </CardWrapper>
      </ThemeProvider>,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with a filter component', () => {
    render(
      <ThemeProvider theme={theme}>
        <CardWrapper title="With Filter" filter={<button>Filter</button>}>
          <p>Content</p>
        </CardWrapper>
      </ThemeProvider>,
    );

    expect(screen.getByText('With Filter')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('should not render filter when not provided', () => {
    render(
      <ThemeProvider theme={theme}>
        <CardWrapper title="No Filter">
          <p>Content</p>
        </CardWrapper>
      </ThemeProvider>,
    );

    expect(screen.getByText('No Filter')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /filter/i }),
    ).not.toBeInTheDocument();
  });

  it('should include a divider', () => {
    render(
      <ThemeProvider theme={theme}>
        <CardWrapper title="With Divider">
          <p>Content</p>
        </CardWrapper>
      </ThemeProvider>,
    );

    const divider = screen.getByRole('separator');
    expect(divider).toBeInTheDocument();
  });
});
