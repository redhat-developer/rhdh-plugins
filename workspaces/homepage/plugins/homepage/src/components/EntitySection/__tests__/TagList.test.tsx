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

import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { mockUseTranslation } from '../../../test-utils/mockTranslations';
import TagList from '../TagList';

jest.mock('@backstage/core-components', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const theme = createTheme();

const renderTagList = (tags: string[], kind: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TagList tags={tags} kind={kind} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('TagList', () => {
  it('renders kind chip and tags', () => {
    renderTagList(['react', 'typescript'], 'component');

    expect(screen.getByText('component')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('shows overflow count when more than 3 tags', () => {
    renderTagList(['tag1', 'tag2', 'tag3', 'tag4', 'tag5'], 'api');

    expect(screen.getByText('2 more')).toBeInTheDocument();
    expect(screen.queryByText('tag3')).not.toBeInTheDocument();
  });

  it('links kind chip to catalog with kind filter', () => {
    renderTagList(['react'], 'component');

    const kindLink = screen.getByRole('link', { name: 'component' });
    expect(kindLink).toHaveAttribute(
      'href',
      '/catalog?filters%5Bkind%5D=component&filters%5Buser%5D=all',
    );
  });
});
