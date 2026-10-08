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

import { CardWrapper } from '../CardWrapper';

describe('CardWrapper Component', () => {
  it('should render with title, subtitle and children', () => {
    render(
      <CardWrapper title="Test Title" subheader="Test Subheader">
        <p>Test Content</p>
      </CardWrapper>,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subheader')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with a divider', () => {
    render(
      <CardWrapper title="Test Title" subheader="Test Subheader">
        <p>Test Content</p>
      </CardWrapper>,
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('should show full description in tooltip on hover', async () => {
    const user = userEvent.setup();
    const description =
      'This is a long scorecard description that should appear in full on hover';

    render(
      <CardWrapper title="Test Title" description={description}>
        <p>Test Content</p>
      </CardWrapper>,
    );

    await user.hover(screen.getByText(description));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(description);
  });
});
