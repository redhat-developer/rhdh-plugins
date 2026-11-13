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
import { fireEvent, render, screen } from '@testing-library/react';
import {
  FieldHelp,
  FieldLabelWithHelp,
  FieldWithHelpLayout,
} from './FieldHelp';

describe('FieldHelp', () => {
  it('renders help icon and opens popover with markdown and link on hover', () => {
    render(
      <FieldHelp
        fieldLabel="Component"
        content={{
          title: 'Component',
          body: 'Choose the **catalog Component**.',
          link: { label: 'Learn more', url: 'https://example.com/docs' },
        }}
      />,
    );

    const button = screen.getByTestId('field-help-button');
    expect(button).toHaveAttribute(
      'aria-label',
      'More information about Component',
    );

    fireEvent.mouseEnter(button);

    expect(screen.getByTestId('field-help-popover')).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText(/catalog Component/i)).toBeInTheDocument();

    const link = screen.getByTestId('field-help-link');
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('Learn more');
  });

  it('FieldLabelWithHelp omits icon when help is missing', () => {
    render(<FieldLabelWithHelp label="Name" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByTestId('field-help-button')).not.toBeInTheDocument();
  });

  it('FieldLabelWithHelp shows icon when help is provided', () => {
    render(
      <FieldLabelWithHelp
        label="Name"
        help={{ body: 'Helpful details about the name.' }}
      />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByTestId('field-help-button')).toBeInTheDocument();
  });

  it('FieldWithHelpLayout places label and help above children', () => {
    render(
      <FieldWithHelpLayout
        label="Process name"
        required
        help={{ body: 'Unique name for this process.' }}
      >
        <input data-testid="child-input" />
      </FieldWithHelpLayout>,
    );

    expect(screen.getByText(/Process name/)).toBeInTheDocument();
    expect(screen.getByTestId('field-help-button')).toBeInTheDocument();
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('FieldWithHelpLayout leaves children unchanged when help is missing', () => {
    render(
      <FieldWithHelpLayout label="Process name">
        <input aria-label="Process name" data-testid="child-input" />
      </FieldWithHelpLayout>,
    );

    expect(screen.queryByTestId('field-help-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });
});
