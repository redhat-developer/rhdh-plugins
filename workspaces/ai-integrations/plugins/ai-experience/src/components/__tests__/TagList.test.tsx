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
import TagList from '../ModelSection/TagList';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { mockUseTranslation } from '../../test-utils/mockTranslations';

// Mock dependencies
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={lightTheme}>{component}</ThemeProvider>);
};

describe('TagList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tags when there are 3 or fewer tags', () => {
    const tags = ['tag1', 'tag2', 'tag3'];

    renderWithTheme(<TagList tags={tags} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('renders first 3 tags and shows "more" count when there are more than 3 tags', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];

    renderWithTheme(<TagList tags={tags} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.getByText('2 more')).toBeInTheDocument();
  });

  it('shows correct "more" count for exactly 4 tags', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4'];

    renderWithTheme(<TagList tags={tags} />);

    expect(screen.getByText('1 more')).toBeInTheDocument();
  });

  it('shows correct "more" count for many tags', () => {
    const tags = [
      'tag1',
      'tag2',
      'tag3',
      'tag4',
      'tag5',
      'tag6',
      'tag7',
      'tag8',
    ];

    renderWithTheme(<TagList tags={tags} />);

    expect(screen.getByText('5 more')).toBeInTheDocument();
  });

  it('renders empty list when no tags provided', () => {
    renderWithTheme(<TagList tags={[]} />);

    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('uses translated "more" text', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4'];

    renderWithTheme(<TagList tags={tags} />);

    // The mock translation should return the English text
    expect(screen.getByText('1 more')).toBeInTheDocument();
  });
});
