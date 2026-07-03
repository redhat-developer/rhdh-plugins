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

import { SourcesCardProps } from '@patternfly/chatbot';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { SourcesChipModal } from '../SourcesChipModal';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockSources: SourcesCardProps = {
  sources: [
    {
      title: 'aws-bedrock-walkthrough.md',
      body: 'Documentation covering architecture, usage guidelines, and best practices.',
      link: 'https://example.com/aws-bedrock',
      isExternal: true,
    },
    {
      title: 'codecov.yml',
      body: 'Application configuration including backend, database, authentication, and catalog settings.',
      link: 'https://example.com/codecov',
      isExternal: true,
    },
  ],
};

describe('SourcesChipModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render the chip with correct source count', () => {
    render(<SourcesChipModal sources={mockSources} />);

    expect(screen.getByText('2 Sources')).toBeInTheDocument();
  });

  test('should not render when sources array is empty', () => {
    const emptySources: SourcesCardProps = { sources: [] };
    const { container } = render(<SourcesChipModal sources={emptySources} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('should open popover when chip is clicked', () => {
    render(<SourcesChipModal sources={mockSources} />);

    fireEvent.click(screen.getByText('2 Sources'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The following sources were used to generate this AI response and provide supporting information:',
      ),
    ).toBeInTheDocument();
  });

  test('should display all source items in the popover', () => {
    render(<SourcesChipModal sources={mockSources} />);

    fireEvent.click(screen.getByText('2 Sources'));

    expect(screen.getByText('aws-bedrock-walkthrough.md')).toBeInTheDocument();
    expect(screen.getByText('codecov.yml')).toBeInTheDocument();
  });

  test('should display source descriptions in the popover', () => {
    render(<SourcesChipModal sources={mockSources} />);

    fireEvent.click(screen.getByText('2 Sources'));

    expect(
      screen.getByText(
        'Documentation covering architecture, usage guidelines, and best practices.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Application configuration including backend, database, authentication, and catalog settings.',
      ),
    ).toBeInTheDocument();
  });

  test('should render FileTypeIcon badges for source filenames', () => {
    render(<SourcesChipModal sources={mockSources} />);

    fireEvent.click(screen.getByText('2 Sources'));

    expect(screen.getByText('md')).toBeInTheDocument();
    expect(screen.getByText('yml')).toBeInTheDocument();
  });

  test('should render source title as plain text when no link', () => {
    const sourcesWithoutLink: SourcesCardProps = {
      sources: [
        {
          title: 'local-doc.yaml',
          body: 'A local document',
          link: '',
        },
      ],
    };

    render(<SourcesChipModal sources={sourcesWithoutLink} />);

    fireEvent.click(screen.getByText('1 Sources'));

    expect(screen.getByText('local-doc.yaml')).toBeInTheDocument();
  });

  test('should close popover when close button is clicked', () => {
    render(<SourcesChipModal sources={mockSources} />);

    fireEvent.click(screen.getByText('2 Sources'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', {
      name: 'Close sources',
    });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('should toggle popover when chip is clicked again', () => {
    render(<SourcesChipModal sources={mockSources} />);

    const chip = screen.getByText('2 Sources');

    fireEvent.click(chip);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(chip);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('should show fallback title when source title is missing', () => {
    const sourcesWithoutTitle: SourcesCardProps = {
      sources: [
        {
          link: 'https://example.com/doc',
          isExternal: true,
        },
      ],
    };

    render(<SourcesChipModal sources={sourcesWithoutTitle} />);

    fireEvent.click(screen.getByText('1 Sources'));

    expect(screen.getByText('Source 1')).toBeInTheDocument();
  });
});
